"""Tests for Keep-Alive Pinger Service."""

from unittest.mock import patch, AsyncMock
import pytest
from app.services.keep_alive import PING_INTERVAL_SECONDS


@pytest.mark.asyncio
async def test_ping_interval_constant():
    # Confirm ping interval is set to 10 minutes (600s) < Render 15-min timeout
    assert PING_INTERVAL_SECONDS == 600


@pytest.mark.asyncio
async def test_keep_alive_standalone_script():
    from unittest.mock import MagicMock
    from scripts.ping_keep_alive import ping_health

    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_response = MagicMock()
        mock_response.getcode.return_value = 200
        mock_response.read.return_value = b'{"status":"ok"}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        result = ping_health("http://127.0.0.1:8000")
        assert result is True
