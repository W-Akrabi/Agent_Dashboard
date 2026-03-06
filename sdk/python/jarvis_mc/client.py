"""
Jarvis Mission Control Python SDK.

Connect any agent — Claude, OpenAI, custom — to your Jarvis dashboard in 3 lines.

Basic usage:
    from jarvis_mc import JarvisAgent

    agent = JarvisAgent(token="your-token", base_url="http://localhost:8000")
    agent.log("Fetching competitor data", cost=0.04)

With approval gates:
    task_id = agent.checkpoint(
        "Draft ready for review",
        proposed_action="Publish to Notion workspace",
        completed_actions=["Wrote 1800-word analysis"],
    )
    decision = agent.wait_for_decision()  # blocks until you approve/reject in dashboard
    if decision["decision"] == "approved":
        publish()

With Claude (auto-reports cost + response):
    from jarvis_mc import AnthropicJarvis

    client = AnthropicJarvis(jarvis_token="your-token", jarvis_url="http://localhost:8000")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Summarize this report..."}],
    )
"""
from __future__ import annotations

import time
from typing import Any

import requests

_DEFAULT_BASE_URL = "http://localhost:8000"

# claude-sonnet-4-6 pricing (per token)
_INPUT_COST_PER_TOKEN = 3.00 / 1_000_000
_OUTPUT_COST_PER_TOKEN = 15.00 / 1_000_000


class JarvisAgent:
    """
    Core Jarvis Mission Control client. Works with any underlying AI model.

    Parameters
    ----------
    token:
        The agent token shown at agent creation in the Jarvis dashboard.
    base_url:
        Jarvis API base URL. Defaults to http://localhost:8000.
    timeout:
        HTTP request timeout in seconds. Defaults to 30.
    """

    def __init__(
        self,
        token: str,
        base_url: str = _DEFAULT_BASE_URL,
        timeout: float = 30.0,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._session = requests.Session()
        self._session.headers.update({
            "X-Agent-Token": token,
            "Content-Type": "application/json",
            "User-Agent": "jarvis-mc-python/0.1.0",
        })

    def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        response = self._session.post(
            f"{self._base_url}{path}", json=body, timeout=self._timeout
        )
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]

    def _get(self, path: str) -> list[dict[str, Any]]:
        response = self._session.get(
            f"{self._base_url}{path}", timeout=self._timeout
        )
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]

    def log(
        self,
        message: str,
        cost: float = 0.0,
        type: str = "action",  # noqa: A002
        completed_actions: list[str] | None = None,
    ) -> str:
        """
        Log an event to the dashboard. Returns the event ID.

        Parameters
        ----------
        message:
            What the agent did.
        cost:
            USD cost for this step.
        type:
            One of: action, completion, error, tool_call, approval_request.
        completed_actions:
            Optional list of previously completed steps for context.
        """
        data = self._post("/v1/events", {
            "type": type,
            "message": message,
            "cost": cost,
            "requiresApproval": False,
            "completedActions": completed_actions or [],
        })
        return str(data["event"]["id"])

    def checkpoint(
        self,
        message: str,
        proposed_action: str,
        cost: float = 0.0,
        completed_actions: list[str] | None = None,
    ) -> str:
        """
        Request human approval before proceeding. Returns the task ID.

        The dashboard inbox will show this request. Call wait_for_decision()
        to block until you approve or reject it.

        Parameters
        ----------
        message:
            Description of what is about to happen.
        proposed_action:
            The specific action requiring approval (shown to the reviewer).
        cost:
            USD cost incurred up to this point.
        completed_actions:
            Optional list of already-completed steps shown for context.
        """
        data = self._post("/v1/events", {
            "type": "approval_request",
            "message": message,
            "cost": cost,
            "requiresApproval": True,
            "proposedAction": proposed_action,
            "completedActions": completed_actions or [],
        })
        task_id = data.get("taskId")
        if not task_id:
            raise RuntimeError("Server did not return a taskId for the checkpoint.")
        return str(task_id)

    def wait_for_decision(self, poll_interval: float = 5.0) -> dict[str, Any]:
        """
        Block until a human approves or rejects in the dashboard.

        Automatically acknowledges the command before returning.

        Returns the decision payload, e.g.:
            {"decision": "approved", "comment": "Go ahead"}
            {"decision": "rejected", "comment": "Too risky"}

        Parameters
        ----------
        poll_interval:
            Seconds between polls. Defaults to 5.
        """
        while True:
            commands = self._get("/v1/commands")
            for cmd in commands:
                if cmd.get("kind") == "approval_decision" and cmd.get("status") == "pending":
                    self.ack(cmd["id"])
                    return cmd.get("payload", {})  # type: ignore[return-value]
            time.sleep(poll_interval)

    def ack(self, command_id: str) -> dict[str, Any]:
        """
        Acknowledge a command by ID, marking it as processed.

        Parameters
        ----------
        command_id:
            The UUID of the command to acknowledge.
        """
        return self._post(f"/v1/commands/{command_id}/ack", {})

    # ── Comms Hub helpers ─────────────────────────────────────────────────────

    def get_human_messages(self) -> list[dict[str, Any]]:
        """
        Return all pending human_message commands for this agent.

        These are messages sent by the user from the Comms Hub that are waiting
        for the agent to read and reply. Each command contains:
            - id: command UUID (use to ack)
            - payload.messageId: comms_messages UUID
            - payload.content: the human's message text

        Example::
            for cmd in agent.get_human_messages():
                print(cmd["payload"]["content"])
                agent.respond_to_human_command(cmd, "Got it!")
        """
        commands = self._get("/v1/commands")
        return [c for c in commands if c.get("kind") == "human_message" and c.get("status") == "pending"]

    def reply(
        self,
        content: str,
        reply_to_message_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Post a reply to the Comms Hub as the agent.

        Parameters
        ----------
        content:
            The reply text to send back to the human.
        reply_to_message_id:
            Optional UUID of the comms_messages row being replied to.
            When provided, the parent human message is marked as 'responded'.
        metadata:
            Optional dict (e.g. {"cost": 0.012, "model": "claude-sonnet-4-6"}).
        """
        body: dict[str, Any] = {
            "content": content,
            "metadata": metadata or {},
        }
        if reply_to_message_id:
            body["replyToMessageId"] = reply_to_message_id
        return self._post("/v1/comms/replies", body)

    # ── Workshop helpers ──────────────────────────────────────────────────────

    def get_my_tasks(self) -> list[dict[str, Any]]:
        """
        Return tasks assigned to this agent that are in 'backlog' or 'in_progress'.

        Tasks are ordered so in-progress items come first. Each task contains:
            - id: UUID of the task
            - title: what needs to be done
            - description: optional detailed instructions
            - status: 'backlog' or 'in_progress'

        Example::
            for task in agent.get_my_tasks():
                print(task["title"])
                agent.start_task(task["id"])
        """
        return self._get("/v1/workshop/my-tasks")

    def update_task_status(self, task_id: str, status: str) -> dict[str, Any]:
        """
        Update the status of a task assigned to this agent.

        Parameters
        ----------
        task_id:
            UUID of the workshop task.
        status:
            One of: 'backlog', 'in_progress', 'done'.

        Example::
            agent.update_task_status(task["id"], "in_progress")
            # ... do the work ...
            agent.update_task_status(task["id"], "done")
        """
        return self._post(f"/v1/workshop/my-tasks/{task_id}/status", {"status": status})

    def start_task(self, task_id: str) -> dict[str, Any]:
        """Move a task to 'in_progress'. Shorthand for update_task_status(task_id, 'in_progress')."""
        return self.update_task_status(task_id, "in_progress")

    def complete_task(self, task_id: str) -> dict[str, Any]:
        """Mark a task as 'done'. Shorthand for update_task_status(task_id, 'done')."""
        return self.update_task_status(task_id, "done")

    def respond_to_human_command(
        self,
        command: dict[str, Any],
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Reply to a human_message command then acknowledge it.

        This is the canonical one-call flow for responding to a Comms Hub
        message from the agent side:
        1. POST /v1/comms/replies (marks parent message as responded)
        2. POST /v1/commands/{id}/ack (marks command as acked)

        Parameters
        ----------
        command:
            A command dict returned by get_human_messages().
        content:
            The reply text.
        metadata:
            Optional metadata (e.g. cost, model name).

        Returns
        -------
        The created CommsMessage dict from the reply endpoint.

        Example::
            for cmd in agent.get_human_messages():
                reply = agent.respond_to_human_command(cmd, "Working on it!")
        """
        message_id = command.get("payload", {}).get("messageId")
        reply_msg = self.reply(content, reply_to_message_id=message_id, metadata=metadata)
        try:
            self.ack(command["id"])
        except Exception:  # noqa: BLE001
            pass  # ack failure shouldn't block the caller
        return reply_msg


class AnthropicJarvis:
    """
    Drop-in wrapper around anthropic.Anthropic that auto-reports every
    Claude call (cost + response summary) to your Jarvis dashboard.

    Usage:
        from jarvis_mc import AnthropicJarvis

        client = AnthropicJarvis(
            jarvis_token="your-token",
            jarvis_url="http://localhost:8000",
        )
        # Identical to anthropic.Anthropic().messages.create(...)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": "Summarize this..."}],
        )

    All keyword arguments (except jarvis_token, jarvis_url, jarvis_timeout)
    are forwarded to anthropic.Anthropic.__init__.

    Requires: pip install jarvis-mc[anthropic]
    """

    def __init__(
        self,
        *args: Any,
        jarvis_token: str,
        jarvis_url: str = _DEFAULT_BASE_URL,
        jarvis_timeout: float = 30.0,
        **kwargs: Any,
    ) -> None:
        try:
            import anthropic as _anthropic  # type: ignore[import]
        except ImportError as exc:
            raise ImportError(
                "The 'anthropic' package is required for AnthropicJarvis.\n"
                "Install it with: pip install jarvis-mc[anthropic]"
            ) from exc

        self._jarvis = JarvisAgent(
            token=jarvis_token,
            base_url=jarvis_url,
            timeout=jarvis_timeout,
        )
        self._client = _anthropic.Anthropic(*args, **kwargs)
        self.messages = _JarvisMessages(self._client.messages, self._jarvis)


class _JarvisMessages:
    """Proxy for anthropic.messages that auto-logs every call to Jarvis."""

    def __init__(self, messages: Any, jarvis: JarvisAgent) -> None:
        self._messages = messages
        self._jarvis = jarvis

    def create(self, **kwargs: Any) -> Any:
        response = self._messages.create(**kwargs)

        usage = getattr(response, "usage", None)
        cost = 0.0
        if usage is not None:
            cost = (
                (getattr(usage, "input_tokens", 0) or 0) * _INPUT_COST_PER_TOKEN
                + (getattr(usage, "output_tokens", 0) or 0) * _OUTPUT_COST_PER_TOKEN
            )

        model = getattr(response, "model", "claude")
        first_text = next(
            (
                getattr(b, "text", "")
                for b in (getattr(response, "content", []) or [])
                if getattr(b, "type", "") == "text"
            ),
            "",
        )
        message = f"[{model}] {first_text[:200]}" if first_text else f"[{model}] API call"

        try:
            self._jarvis.log(message=message, cost=cost, type="action")
        except Exception:  # noqa: BLE001
            pass  # Jarvis errors never break agent code

        return response
