import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const topUsers = await prisma.user.findMany({
            orderBy: { totalPoints: 'desc' }, 
            take: 20
        });
        
        res.status(200).json({
            success: true,
            data: topUsers,
            message: "Leaderboard fetched successfully"
        });
    } catch (error) {
        console.error("Leaderboard fetch failed", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch leaderboard"
        });
    }
};
