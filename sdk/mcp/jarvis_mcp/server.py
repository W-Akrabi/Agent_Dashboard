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
    log_action        — Report a significant action or milestone
    request_approval  — Block until a human approves/rejects in the dashboard
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

            # Step 2: Poll for decision until approved/rejected or timed out
            while time.monotonic() < deadline:
                await asyncio.sleep(3)

                try:
                    cmd_response = await client.get(f"{JARVIS_URL}/v1/commands")
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
