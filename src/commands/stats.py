
import discord
from discord import app_commands
from discord.ext import commands
from typing import Optional
from datetime import datetime, timedelta
from ..utils.base_cog import BaseCog
from ..utils.embeds import EmbedUtils
from ..utils.constants import Emojis, Colors
from ..services.database import UserStats
import math


def xp_for_level(level: int) -> int:

    return int(100 * (level ** 1.5))


def level_from_xp(xp: int) -> int:

    level = 1
    while xp >= xp_for_level(level):
        xp -= xp_for_level(level)
        level += 1
    return level


class Stats(BaseCog):


    @app_commands.command(name="rank", description="View your or another user's rank")
    @app_commands.describe(user="The user to check (optional)")
    async def rank(self, interaction: discord.Interaction, user: Optional[discord.Member] = None):
        await interaction.response.defer()
        
        target = user or interaction.user
        
        stats, _ = await UserStats.get_or_create(
            guild_id=str(interaction.guild_id),
            user_id=str(target.id),
            defaults={"xp": 0, "level": 1, "messages": 0}
        )
        
        # Calculate rank position
        all_users = await UserStats.filter(guild_id=str(interaction.guild_id)).order_by('-xp')
        rank_pos = 1
        for i, u in enumerate(all_users):
            if u.user_id == str(target.id):
                rank_pos = i + 1
                break
        
        # Calculate progress to next level
        current_level_xp = xp_for_level(stats.level)
        progress = (stats.xp % current_level_xp) / current_level_xp * 100 if current_level_xp > 0 else 0
        
        embed = discord.Embed(
            title=f"📊 {target.display_name}'s Rank",
            color=Colors.INFO
        )
        embed.set_thumbnail(url=target.display_avatar.url)
        embed.add_field(name="Level", value=f"**{stats.level}**", inline=True)
        embed.add_field(name="XP", value=f"**{stats.xp:,}**", inline=True)
        embed.add_field(name="Rank", value=f"**#{rank_pos}**", inline=True)
        embed.add_field(name="Messages", value=f"**{stats.messages:,}**", inline=True)
        embed.add_field(name="Progress", value=f"**{progress:.1f}%**", inline=True)
        
        await interaction.followup.send(embed=embed)

    @app_commands.command(name="leaderboard-level", description="View the top 10 users by level")
    async def leaderboard_level(self, interaction: discord.Interaction):
        await interaction.response.defer()
        
        top_users = await UserStats.filter(guild_id=str(interaction.guild_id)).order_by('-level', '-xp').limit(10)
        
        if not top_users:
            return await interaction.followup.send(embed=EmbedUtils.info("Empty", "No users have earned XP yet."))
        
        embed = discord.Embed(
            title=f"🏆 Level Leaderboard",
            color=Colors.PRIMARY
        )
        
        leaderboard_text = ""
        medals = ["🥇", "🥈", "🥉"]
        
        for i, stats in enumerate(top_users):
            medal = medals[i] if i < 3 else f"**{i+1}.**"
            leaderboard_text += f"{medal} <@{stats.user_id}> - Level **{stats.level}** ({stats.xp:,} XP)\n"
        
        embed.description = leaderboard_text
        await interaction.followup.send(embed=embed)

    @app_commands.command(name="daily", description="Claim your daily XP reward")
    async def daily(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        
        stats, created = await UserStats.get_or_create(
            guild_id=str(interaction.guild_id),
            user_id=str(interaction.user.id),
            defaults={"xp": 0, "level": 1, "messages": 0}
        )
        
        now = datetime.utcnow()
        
        if stats.last_daily and (now - stats.last_daily) < timedelta(hours=24):
            remaining = timedelta(hours=24) - (now - stats.last_daily)
            hours, remainder = divmod(int(remaining.total_seconds()), 3600)
            minutes, _ = divmod(remainder, 60)
            return await interaction.followup.send(
                embed=EmbedUtils.error("Already Claimed", f"You can claim again in **{hours}h {minutes}m**.")
            )
        
        # Give daily XP
        daily_xp = 100
        stats.xp += daily_xp
        stats.last_daily = now
        
        # Check for level up
        new_level = level_from_xp(stats.xp)
        leveled_up = new_level > stats.level
        stats.level = new_level
        
        await stats.save()
        
        message = f"You received **{daily_xp} XP**!"
        if leveled_up:
            message += f"\n🎉 You leveled up to **Level {new_level}**!"
        
        await interaction.followup.send(embed=EmbedUtils.success("Daily Claimed!", message))

    @app_commands.command(name="addxp", description="Add XP to a user")
    @app_commands.describe(user="The user to give XP", amount="Amount of XP to add")
    @app_commands.default_permissions(administrator=True)
    async def addxp(self, interaction: discord.Interaction, user: discord.Member, amount: int):
        await interaction.response.defer(ephemeral=True)
        
        stats, _ = await UserStats.get_or_create(
            guild_id=str(interaction.guild_id),
            user_id=str(user.id),
            defaults={"xp": 0, "level": 1, "messages": 0}
        )
        
        stats.xp += amount
        stats.level = level_from_xp(stats.xp)
        await stats.save()
        
        await interaction.followup.send(
            embed=EmbedUtils.success("XP Added", f"Added **{amount} XP** to {user.mention}.\nNew total: **{stats.xp:,} XP** (Level {stats.level})")
        )

    @app_commands.command(name="removexp", description="Remove XP from a user")
    @app_commands.describe(user="The user to remove XP from", amount="Amount of XP to remove")
    @app_commands.default_permissions(administrator=True)
    async def removexp(self, interaction: discord.Interaction, user: discord.Member, amount: int):
        await interaction.response.defer(ephemeral=True)
        
        stats, _ = await UserStats.get_or_create(
            guild_id=str(interaction.guild_id),
            user_id=str(user.id),
            defaults={"xp": 0, "level": 1, "messages": 0}
        )
        
        stats.xp = max(0, stats.xp - amount)
        stats.level = max(1, level_from_xp(stats.xp))
        await stats.save()
        
        await interaction.followup.send(
            embed=EmbedUtils.success("XP Removed", f"Removed **{amount} XP** from {user.mention}.\nNew total: **{stats.xp:,} XP** (Level {stats.level})")
        )

    @app_commands.command(name="reward-all", description="Give XP to all members with a role")
    @app_commands.describe(role="The role to reward", amount="Amount of XP to give")
    @app_commands.default_permissions(administrator=True)
    async def reward_all(self, interaction: discord.Interaction, role: discord.Role, amount: int):
        await interaction.response.defer(ephemeral=True)
        
        count = 0
        for member in role.members:
            if member.bot:
                continue
            
            stats, _ = await UserStats.get_or_create(
                guild_id=str(interaction.guild_id),
                user_id=str(member.id),
                defaults={"xp": 0, "level": 1, "messages": 0}
            )
            
            stats.xp += amount
            stats.level = level_from_xp(stats.xp)
            await stats.save()
            count += 1
        
        await interaction.followup.send(
            embed=EmbedUtils.success("Bulk Reward", f"Added **{amount} XP** to **{count}** members with {role.mention}.")
        )

    @app_commands.command(name="transferlevel", description="Transfer levels between users")
    @app_commands.describe(from_user="User to transfer from", to_user="User to transfer to")
    @app_commands.default_permissions(administrator=True)
    async def transferlevel(self, interaction: discord.Interaction, from_user: discord.Member, to_user: discord.Member):
        await interaction.response.defer(ephemeral=True)
        
        from_stats = await UserStats.filter(guild_id=str(interaction.guild_id), user_id=str(from_user.id)).first()
        
        if not from_stats or from_stats.xp == 0:
            return await interaction.followup.send(
                embed=EmbedUtils.error("Error", f"{from_user.mention} has no XP to transfer.")
            )
        
        to_stats, _ = await UserStats.get_or_create(
            guild_id=str(interaction.guild_id),
            user_id=str(to_user.id),
            defaults={"xp": 0, "level": 1, "messages": 0}
        )
        
        transferred_xp = from_stats.xp
        to_stats.xp += transferred_xp
        to_stats.level = level_from_xp(to_stats.xp)
        
        from_stats.xp = 0
        from_stats.level = 1
        
        await from_stats.save()
        await to_stats.save()
        
        await interaction.followup.send(
            embed=EmbedUtils.success("Transfer Complete", f"Transferred **{transferred_xp:,} XP** from {from_user.mention} to {to_user.mention}.")
        )


async def setup(bot):
    await bot.add_cog(Stats(bot))
