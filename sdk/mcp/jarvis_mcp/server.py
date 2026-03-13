"""
Jarvis Mission Control — MCP Server

Universal MCP server that connects any MCP-compatible agent to your Jarvis dashboard.
Works with: Claude Code, Codex CLI, Cursor, Windsurf, OpenAI Agents SDK, and more.

Setup (Claude Code / Cursor / Windsurf):
    Add to your settings.json:
    {
      "mcpServers": {
        "jarvis": {
          "command": "python",
          "args": ["/path/to/sdk/mcp/jarvis_mcp/server.py"],
          "env": {
            "JARVIS_TOKEN": "your-agent-token",
            "JARVIS_URL": "http://localhost:8000"
          }
        }
      }
    }

Setup (OpenAI Agents SDK):
    from agents.mcp import MCPServerStdio
    jarvis = MCPServerStdio(
        command="python",
        args=["/path/to/server.py"],
        env={"JARVIS_TOKEN": "...", "JARVIS_URL": "..."}
    )
    agent = Agent(mcp_servers=[jarvis])

Tools exposed:
    log_action           — Report a significant action or milestone
    request_approval     — Block until a human approves/rejects in the dashboard
    fetch_human_messages — Poll for pending human messages from the Comms Hub
    send_human_reply     — Send a reply back to the human in the Comms Hub
"""
from __future__ import annotations

import asyncio
import os
import time

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

JARVIS_TOKEN = os.environ.get("JARVIS_TOKEN", "")
JARVIS_URL = os.environ.get("JARVIS_URL", "http://localhost:8000").rstrip("/")

server = Server("jarvis-mc")


def _headers() -> dict[str, str]:
    return {
        "X-Agent-Token": JARVIS_TOKEN,
        "Content-Type": "application/json",
    }


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="log_action",
            description=(
                "Log a significant action or milestone to the Jarvis Mission Control dashboard. "
                "Use this for important steps, completed tasks, or notable events — "
                "not routine file reads, searches, or minor operations."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "What you did or are doing",
                    },
                    "cost": {
                        "type": "number",
                        "description": "Estimated USD cost incurred (0 if unknown or not applicable)",
                        "default": 0,
                    },
                    "type": {
                        "type": "string",
                        "enum": ["action", "completion", "error", "tool_call"],
                        "description": "Event type",
                        "default": "action",
                    },
                },
                "required": ["message"],
            },
        ),
        Tool(
            name="request_approval",
            description=(
                "Request human approval before proceeding with a significant, irreversible, or risky action. "
                "BLOCKS until the human approves or rejects in the Jarvis dashboard inbox. "
                "Always call this before: deleting files or data, pushing code, sending emails or messages, "
                "making purchases, modifying production systems, or any action that cannot be undone. "
                "Returns the human's decision so you can proceed or abort accordingly."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "Explain what you've done so far and what you're about to do",
                    },
                    "proposed_action": {
                        "type": "string",
                        "description": "The specific action requiring approval (shown to the human reviewer)",
                    },
                    "completed_actions": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of actions already completed, for context",
                        "default": [],
                    },
                    "timeout_minutes": {
                        "type": "integer",
                        "description": "Minutes to wait before timing out. Defaults to 5.",
                        "default": 5,
                    },
                },
                "required": ["message", "proposed_action"],
            },
        ),
        Tool(
            name="fetch_human_messages",
            description=(
                "Fetch pending human messages from the Jarvis Comms Hub. "
                "Returns a list of messages the user has sent from the dashboard that are waiting for an agent reply. "
                "Use this to implement a poll-and-reply loop: check for messages, process them, then call send_human_reply."
            ),
            inputSchema={
                "type": "object",
                "properties": {},
                "required": [],
            },
        ),
        Tool(
            name="get_workshop_tasks",
            description=(
                "Fetch tasks assigned to this agent from the Workshop. "
                "Returns backlog and in-progress tasks in priority order (in-progress first). "
                "Use this at the start of a session to discover what work is queued for you. "
                "After fetching, call update_workshop_task_status to move tasks through the pipeline."
            ),
            inputSchema={
                "type": "object",
                "properties": {},
                "required": [],
            },
        ),
        Tool(
            name="update_workshop_task_status",
            description=(
                "Update the status of a Workshop task assigned to this agent. "
                "Call this to move a task from 'backlog' → 'in_progress' when starting, "
                "and from 'in_progress' → 'done' when complete. "
                "The task_id comes from get_workshop_tasks."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "UUID of the workshop task to update",
                    },
                    "status": {
                        "type": "string",
                        "enum": ["backlog", "in_progress", "done"],
                        "description": "New status for the task",
                    },
                },
                "required": ["task_id", "status"],
            },
        ),
        Tool(
            name="send_human_reply",
            description=(
                "Send a reply to a human message in the Jarvis Comms Hub. "
                "After calling fetch_human_messages and processing a message, use this to send a reply. "
                "Provide the command_id from the fetched message so the original message is marked as responded."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "The reply text to send back to the human",
                    },
                    "command_id": {
                        "type": "string",
                        "description": "The command ID from fetch_human_messages (used to ack and link the reply)",
                    },
                    "reply_to_message_id": {
                        "type": "string",
                        "description": "The comms message UUID to reply to (found in the command payload as messageId)",
                    },
                    "cost": {
                        "type": "number",
                        "description": "Optional USD cost incurred to generate this reply",
                        "default": 0,
                    },
                    "model": {
                        "type": "string",
                        "description": "Optional model name used to generate this reply",
                    },
                },
                "required": ["content", "command_id"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if not JARVIS_TOKEN:
        return [TextContent(type="text", text="Error: JARVIS_TOKEN environment variable is not set.")]

    async with httpx.AsyncClient(headers=_headers(), timeout=10.0) as client:
        if name == "log_action":
            response = await client.post(
                f"{JARVIS_URL}/v1/events",
                json={
                    "type": arguments.get("type", "action"),
                    "message": arguments["message"],
                    "cost": arguments.get("cost", 0),
                    "requiresApproval": False,
                    "completedActions": [],
                },
            )
            response.raise_for_status()
            event_id = response.json()["event"]["id"]
            return [TextContent(type="text", text=f"Logged to Jarvis (event: {event_id})")]

        elif name == "request_approval":
            # Step 1: Create the approval request
            response = await client.post(
                f"{JARVIS_URL}/v1/events",
                json={
                    "type": "approval_request",
                    "message": arguments["message"],
                    "cost": 0,
                    "requiresApproval": True,
                    "proposedAction": arguments["proposed_action"],
                    "completedActions": arguments.get("completed_actions", []),
                },
            )
            response.raise_for_status()

            task_id = response.json().get("taskId")
            timeout_minutes = arguments.get("timeout_minutes", 5)
            deadline = time.monotonic() + (timeout_minutes * 60)

            # Step 2: Long-poll for decision until approved/rejected or timed out
            while time.monotonic() < deadline:
                remaining = deadline - time.monotonic()
                poll_timeout = min(30, max(1, int(remaining)))
                try:
                    cmd_response = await client.get(
                        f"{JARVIS_URL}/v1/commands/listen",
                        params={"timeout": poll_timeout},
                        timeout=poll_timeout + 10,
                    )
                    cmd_response.raise_for_status()
                except httpx.HTTPError:
                    # Dashboard unreachable — keep waiting until timeout
                    continue

                for cmd in cmd_response.json():
                    if cmd.get("kind") == "approval_decision" and cmd.get("status") == "pending":
                        # Acknowledge the command
                        await client.post(f"{JARVIS_URL}/v1/commands/{cmd['id']}/ack")

                        decision = cmd["payload"].get("decision", "unknown")
                        comment = cmd["payload"].get("comment", "")
                        result = f"Decision: {decision}"
                        if comment:
                            result += f". Comment: {comment}"
                        return [TextContent(type="text", text=result)]

            return [TextContent(
                type="text",
                text=f"Decision: timed out after {timeout_minutes} minute(s). No response from dashboard. Treat as rejected and abort."
            )]

        elif name == "get_workshop_tasks":
            try:
                resp = await client.get(f"{JARVIS_URL}/v1/workshop/my-tasks")
                resp.raise_for_status()
            except httpx.HTTPError as exc:
                return [TextContent(type="text", text=f"Error fetching workshop tasks: {exc}")]

            tasks = resp.json()
            if not tasks:
                return [TextContent(type="text", text="No tasks assigned to this agent.")]

            lines = []
            for task in tasks:
                desc = f"\n  description: {task['description']}" if task.get("description") else ""
                lines.append(
                    f"task_id: {task['id']}\n"
                    f"  title: {task['title']}{desc}\n"
                    f"  status: {task['status']}"
                )
            return [TextContent(type="text", text="\n\n".join(lines))]

        elif name == "update_workshop_task_status":
            task_id = arguments["task_id"]
            new_status = arguments["status"]
            try:
                resp = await client.patch(
                    f"{JARVIS_URL}/v1/workshop/my-tasks/{task_id}/status",
                    json={"status": new_status},
                )
                resp.raise_for_status()
            except httpx.HTTPError as exc:
                return [TextContent(type="text", text=f"Error updating task: {exc}")]
            task = resp.json()
            return [TextContent(type="text", text=f"Task '{task['title']}' moved to {new_status}.")]

        elif name == "fetch_human_messages":
            try:
                cmd_response = await client.get(f"{JARVIS_URL}/v1/commands")
                cmd_response.raise_for_status()
            except httpx.HTTPError as exc:
                return [TextContent(type="text", text=f"Error fetching commands: {exc}")]

            human_cmds = [
                c for c in cmd_response.json()
                if c.get("kind") == "human_message" and c.get("status") == "pending"
            ]
            if not human_cmds:
                return [TextContent(type="text", text="No pending human messages.")]

            lines = []
            for cmd in human_cmds:
                payload = cmd.get("payload", {})
                lines.append(
                    f"command_id: {cmd['id']}\n"
                    f"message_id: {payload.get('messageId', '')}\n"
                    f"content: {payload.get('content', '')}"
                )
            return [TextContent(type="text", text="\n\n---\n\n".join(lines))]

        elif name == "send_human_reply":
            metadata: dict = {}
            if arguments.get("cost"):
                metadata["cost"] = arguments["cost"]
            if arguments.get("model"):
                metadata["model"] = arguments["model"]

            reply_body: dict = {
                "content": arguments["content"],
                "metadata": metadata,
            }
            if arguments.get("reply_to_message_id"):
                reply_body["replyToMessageId"] = arguments["reply_to_message_id"]

            try:
                reply_resp = await client.post(f"{JARVIS_URL}/v1/comms/replies", json=reply_body)
                reply_resp.raise_for_status()
            except httpx.HTTPError as exc:
                return [TextContent(type="text", text=f"Error sending reply: {exc}")]

            # Ack the source command
            command_id = arguments.get("command_id")
            if command_id:
                try:
                    await client.post(f"{JARVIS_URL}/v1/commands/{command_id}/ack")
                except httpx.HTTPError:
                    pass  # ack failure is non-fatal

            reply_id = reply_resp.json().get("id", "")
            return [TextContent(type="text", text=f"Reply sent (message: {reply_id})")]

        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main() -> None:
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


def main_sync() -> None:
    asyncio.run(main())


if __name__ == "__main__":
    main_sync()
