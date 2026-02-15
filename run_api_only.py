import asyncio
from dotenv import load_dotenv

load_dotenv()

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
