import os
from dotenv import load_dotenv

# Load environment variables before importing bot/services.
load_dotenv()

from src.bot import bot
from src.utils.logger import logger

def main():
    token = os.getenv("DISCORD_TOKEN")
    if not token:
        logger.critical("DISCORD_TOKEN not found in environment variables.")
        return 1

    try:
        bot.run(token)
        return 0
    except KeyboardInterrupt:
        # Handle graceful shutdown if needed
        return 0
    except Exception as e:
        logger.critical(f"Fatal error starting bot: {e}")
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
