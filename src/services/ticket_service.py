import discord
from typing import Optional, List
from .database import Ticket, GuildConfig
from ..utils.logger import logger
from ..utils.constants import Emojis

class TicketService:
    @staticmethod
    async def create_ticket_channel(guild: discord.Guild, user: discord.Member, category: str, staff_role: discord.Role) -> Optional[discord.TextChannel]:
        """
        Creates a private ticket channel with specific permissions.
        """
        # 1. Find or create category
        # In a real app, we'd fetch the configured category ID from DB
        # For this demo, we look for a category named "Tickets"
        cat_channel = discord.utils.get(guild.categories, name="Tickets")
        if not cat_channel:
             cat_channel = await guild.create_category("Tickets")

        # 2. Set Permissions
        overwrites = {
            guild.default_role: discord.PermissionOverwrite(read_messages=False),
            user: discord.PermissionOverwrite(read_messages=True, send_messages=True, attach_files=True),
            staff_role: discord.PermissionOverwrite(read_messages=True, send_messages=True, manage_messages=True),
            guild.me: discord.PermissionOverwrite(read_messages=True, send_messages=True, manage_channels=True)
        }
        
        # 3. Create Channel
        # Format: ticket-username
        channel_name = f"ticket-{user.name.lower()}"
        try:
            channel = await guild.create_text_channel(name=channel_name, category=cat_channel, overwrites=overwrites)
            
            # 4. Save to DB
            await Ticket.create(
                guild_id=str(guild.id),
                channel_id=str(channel.id),
                creator_id=str(user.id),
                status="OPEN"
            )
            return channel
        except Exception as e:
            logger.error(f"Failed to create ticket channel: {e}")
            return None

    @staticmethod
    async def close_ticket(channel: discord.TextChannel, closer: discord.Member, reason: str = "No reason provided"):
        """
        Closes a ticket: Logs it, saves transcript (stub), deletes channel (optional).
        """
        # 1. Update DB
        ticket = await Ticket.filter(channel_id=str(channel.id)).first()
        if ticket:
            ticket.status = "CLOSED"
            await ticket.save()
            
        # 2. Generate Transcript (Stub)
        # 3. Log (Stub)
        
        # 4. Delete Channel
        await channel.delete(reason=f"Ticket closed by {closer.name}")

ticket_service = TicketService()
