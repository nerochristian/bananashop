
import discord
from discord import app_commands
from discord.ext import commands
from typing import Optional
from ..utils.base_cog import BaseCog
from ..utils.embeds import EmbedUtils
from ..utils.constants import Emojis, Colors
from ..services.database import Sanction


class Moderation(BaseCog):


    @app_commands.command(name="ban", description="Ban a user from the server")
    @app_commands.describe(user="The user to ban", reason="Reason for the ban")
    @app_commands.default_permissions(ban_members=True)
    async def ban(self, interaction: discord.Interaction, user: discord.User, reason: Optional[str] = "No reason provided"):
        await interaction.response.defer(ephemeral=True)
        
        try:
            await interaction.guild.ban(user, reason=reason)
            
            # Log sanction
            await Sanction.create(
                guild_id=str(interaction.guild_id),
                user_id=str(user.id),
                moderator_id=str(interaction.user.id),
                type="ban",
                reason=reason
            )
            
            await interaction.followup.send(
                embed=EmbedUtils.success("User Banned", f"{user.mention} has been banned.\n**Reason:** {reason}")
            )
        except discord.Forbidden:
            await interaction.followup.send(embed=EmbedUtils.error("Error", "I don't have permission to ban this user."))
        except Exception as e:
            await interaction.followup.send(embed=EmbedUtils.error("Error", str(e)))

    @app_commands.command(name="unban", description="Unban a user from the server")
    @app_commands.describe(user_id="The user ID to unban")
    @app_commands.default_permissions(ban_members=True)
    async def unban(self, interaction: discord.Interaction, user_id: str):
        await interaction.response.defer(ephemeral=True)
        
        try:
            user = await self.bot.fetch_user(int(user_id))
            await interaction.guild.unban(user)
            
            await interaction.followup.send(
                embed=EmbedUtils.success("User Unbanned", f"{user.mention} has been unbanned.")
            )
        except discord.NotFound:
            await interaction.followup.send(embed=EmbedUtils.error("Error", "User not found or not banned."))
        except Exception as e:
            await interaction.followup.send(embed=EmbedUtils.error("Error", str(e)))

    @app_commands.command(name="kick", description="Kick a user from the server")
    @app_commands.describe(user="The user to kick", reason="Reason for the kick")
    @app_commands.default_permissions(kick_members=True)
    async def kick(self, interaction: discord.Interaction, user: discord.Member, reason: Optional[str] = "No reason provided"):
        await interaction.response.defer(ephemeral=True)
        
        try:
            await user.kick(reason=reason)
            
            # Log sanction
            await Sanction.create(
                guild_id=str(interaction.guild_id),
                user_id=str(user.id),
                moderator_id=str(interaction.user.id),
                type="kick",
                reason=reason
            )
            
            await interaction.followup.send(
                embed=EmbedUtils.success("User Kicked", f"{user.mention} has been kicked.\n**Reason:** {reason}")
            )
        except discord.Forbidden:
            await interaction.followup.send(embed=EmbedUtils.error("Error", "I don't have permission to kick this user."))
        except Exception as e:
            await interaction.followup.send(embed=EmbedUtils.error("Error", str(e)))

    @app_commands.command(name="sanction", description="Add a sanction/warning to a user")
    @app_commands.describe(user="The user to sanction", type="Type of sanction", reason="Reason for the sanction")
    @app_commands.choices(type=[
        app_commands.Choice(name="Warning", value="warn"),
        app_commands.Choice(name="Mute", value="mute"),
        app_commands.Choice(name="Temporary Ban", value="tempban"),
    ])
    @app_commands.default_permissions(moderate_members=True)
    async def sanction(self, interaction: discord.Interaction, user: discord.Member, type: str, reason: str):
        await interaction.response.defer(ephemeral=True)
        
        await Sanction.create(
            guild_id=str(interaction.guild_id),
            user_id=str(user.id),
            moderator_id=str(interaction.user.id),
            type=type,
            reason=reason
        )
        
        type_display = {"warn": "Warning", "mute": "Mute", "tempban": "Temporary Ban"}.get(type, type)
        
        await interaction.followup.send(
            embed=EmbedUtils.success("Sanction Added", f"**Type:** {type_display}\n**User:** {user.mention}\n**Reason:** {reason}")
        )

    @app_commands.command(name="view-sanctions", description="View a user's sanction history")
    @app_commands.describe(user="The user to check")
    @app_commands.default_permissions(moderate_members=True)
    async def view_sanctions(self, interaction: discord.Interaction, user: discord.User):
        await interaction.response.defer(ephemeral=True)
        
        sanctions = await Sanction.filter(guild_id=str(interaction.guild_id), user_id=str(user.id)).order_by('-created_at').limit(10)
        
        if not sanctions:
            return await interaction.followup.send(embed=EmbedUtils.info("No Sanctions", f"{user.mention} has no sanctions."))
        
        embed = discord.Embed(title=f"{Emojis.WARNING} Sanctions for {user.name}", color=Colors.WARNING)
        
        for s in sanctions:
            mod = f"<@{s.moderator_id}>"
            embed.add_field(
                name=f"#{s.id} - {s.type.upper()}",
                value=f"**By:** {mod}\n**Reason:** {s.reason or 'N/A'}\n**Date:** {s.created_at.strftime('%Y-%m-%d')}",
                inline=False
            )
        
        await interaction.followup.send(embed=embed)

    @app_commands.command(name="remove-sanction", description="Remove a sanction by ID")
    @app_commands.describe(sanction_id="The sanction ID to remove")
    @app_commands.default_permissions(administrator=True)
    async def remove_sanction(self, interaction: discord.Interaction, sanction_id: int):
        await interaction.response.defer(ephemeral=True)
        
        sanction = await Sanction.filter(id=sanction_id, guild_id=str(interaction.guild_id)).first()
        
        if not sanction:
            return await interaction.followup.send(embed=EmbedUtils.error("Not Found", "Sanction not found."))
        
        await sanction.delete()
        await interaction.followup.send(embed=EmbedUtils.success("Removed", f"Sanction #{sanction_id} has been removed."))

    @app_commands.command(name="remove-all-sanctions", description="Remove all sanctions for a user")
    @app_commands.describe(user="The user to clear sanctions for")
    @app_commands.default_permissions(administrator=True)
    async def remove_all_sanctions(self, interaction: discord.Interaction, user: discord.User):
        await interaction.response.defer(ephemeral=True)
        
        deleted = await Sanction.filter(guild_id=str(interaction.guild_id), user_id=str(user.id)).delete()
        
        await interaction.followup.send(
            embed=EmbedUtils.success("Sanctions Cleared", f"Removed {deleted} sanctions from {user.mention}.")
        )


async def setup(bot):
    await bot.add_cog(Moderation(bot))
