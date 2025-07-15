use anchor_lang::prelude::*;
use crate::state::player_data::PlayerData;

#[derive(Accounts)]
pub struct ResetPlayer<'info> {
    #[account(mut, seeds = [b"player", authority.key().as_ref()], bump)]
    pub player_data: Account<'info, PlayerData>,
    pub authority: Signer<'info>,
}


pub fn reset_player(ctx: Context<ResetPlayer>) -> Result<()> {
    let player = &mut ctx.accounts.player_data;

    player.click = 0;
    Ok(())
}

