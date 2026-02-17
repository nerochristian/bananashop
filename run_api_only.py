import asyncio
import os
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault("AUTH_SESSION_SECRET", "robloxkeys-local-dev-session-secret-change-me")
os.environ.setdefault(
    "BRAND_LOGO_URL",
    "https://cdn.discordapp.com/icons/1388303592502333530/9d7828a6890fa9cbd6ce373d295992b3.webp?size=512&quality=lossless",
)
os.environ.setdefault(
    "BRAND_BANNER_URL",
    "https://cdn.discordapp.com/banners/1388303592502333530/f51da5b94a949ddd93ce874a8f58176a.webp?size=1024",
)

from src.services.web_bridge import WebsiteBridgeServer
from src.utils.logger import logger


class _ApiOnlyBot:
    guilds = []

    def get_channel(self, channel_id):
        return None


async def _run() -> None:
    server = WebsiteBridgeServer(_ApiOnlyBot())
    await server.start()
    logger.info("API-only mode active (Discord bot is not connected).")
    try:
        while True:
            await asyncio.sleep(3600)
    except KeyboardInterrupt:
        pass
    finally:
        await server.stop()


if __name__ == "__main__":
    asyncio.run(_run())
