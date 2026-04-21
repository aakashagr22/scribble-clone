import { Room } from './Room';

export class VoteKickManager {
    private room: Room;
    private votes: Map<string, Set<string>>;

    constructor(room: Room) {
        this.room = room;
        this.votes = new Map();
    }

    public registerVote(votingPlayerId: string, targetPlayerId: string): boolean {
      
        if (!this.room.players.has(votingPlayerId) || !this.room.players.has(targetPlayerId)) return false;

        if (!this.votes.has(targetPlayerId)) {
            this.votes.set(targetPlayerId, new Set());
        }

        const targetVotes = this.votes.get(targetPlayerId)!;
        targetVotes.add(votingPlayerId);

       
        const totalPlayers = this.room.players.size;
        const requiredVotes = Math.floor(totalPlayers / 2) + 1;

        this.room.broadcast('vote_kick', { target: targetPlayerId, current: targetVotes.size, required: requiredVotes });

        if (targetVotes.size >= requiredVotes) {
            this.executeKick(targetPlayerId);
            return true;
        }

        return false;
    }

    private executeKick(targetPlayerId: string) {
        const targetPlayer = this.room.players.get(targetPlayerId);
        if (!targetPlayer) return;

        this.room.broadcast('chat_msg', { 
            sender: 'System', 
            text: `${targetPlayer.username} was kicked by vote.`, 
            type: 'system-info' 
        });
        this.room.broadcast('kick_player', { target: targetPlayerId });

        
        this.votes.delete(targetPlayerId);
        this.room.removePlayer(targetPlayerId);
    }

    public removeTarget(targetPlayerId: string) {
        this.votes.delete(targetPlayerId);
      
        this.votes.forEach(voteSet => {
            voteSet.delete(targetPlayerId);
        });
    }
}
