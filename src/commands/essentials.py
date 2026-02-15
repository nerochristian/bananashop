from ..utils.base_cog import BaseCog


class Essentials(BaseCog):
    # Note: /help is in utility.py with dynamic cog listing
    # Note: /close is in tickets.py
    # Note: /invoice-id is in orders.py
    pass


async def setup(bot):
    await bot.add_cog(Essentials(bot))

