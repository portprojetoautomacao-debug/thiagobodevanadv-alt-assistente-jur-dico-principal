"""
Google Calendar Integration Service
===================================

Service for handling Google Calendar OAuth2 flow and API interactions.
"""

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

# Scopes required for the application
SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
]


class GoogleCalendarService:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.redirect_uri = os.getenv(
            "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/calendar/callback"
        )

        if not self.client_id or not self.client_secret:
            logger.warning("Google Client ID/Secret not configured")

    def _get_client_config(self) -> Dict[str, Any]:
        """Constructs client config from env vars"""
        return {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [self.redirect_uri],
            }
        }

    def get_auth_url(self) -> str:
        """Generates the authorization URL"""
        if not self.client_id or not self.client_secret:
            raise ValueError("Google Calendar credentials not configured")

        flow = Flow.from_client_config(
            self._get_client_config(), scopes=SCOPES, redirect_uri=self.redirect_uri
        )

        authorization_url, state = flow.authorization_url(
            access_type="offline", include_granted_scopes="true"
        )

        return authorization_url

    def get_credentials_from_code(self, code: str) -> Dict[str, Any]:
        """Exchanges auth code for credentials"""
        flow = Flow.from_client_config(
            self._get_client_config(), scopes=SCOPES, redirect_uri=self.redirect_uri
        )

        flow.fetch_token(code=code)
        credentials = flow.credentials

        return self._credentials_to_dict(credentials)

    def _credentials_to_dict(self, credentials: Credentials) -> Dict[str, Any]:
        """Converts Credentials object to dictionary"""
        return {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
        }

    def _get_service(self, token_info: Dict[str, Any]):
        """Builds the Calendar API service"""
        credentials = Credentials(
            token=token_info.get("token"),
            refresh_token=token_info.get("refresh_token"),
            token_uri=token_info.get("token_uri"),
            client_id=token_info.get("client_id"),
            client_secret=token_info.get("client_secret"),
            scopes=token_info.get("scopes"),
        )

        return build("calendar", "v3", credentials=credentials)

    def list_upcoming_events(
        self, token_info: Dict[str, Any], max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Lists upcoming events"""
        service = self._get_service(token_info)

        now = datetime.utcnow().isoformat() + "Z"  # 'Z' indicates UTC time

        events_result = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=now,
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )

        return events_result.get("items", [])

    def create_event(
        self, token_info: Dict[str, Any], event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Creates a new event"""
        service = self._get_service(token_info)

        event = service.events().insert(calendarId="primary", body=event_data).execute()

        return event
