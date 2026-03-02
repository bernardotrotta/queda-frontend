// Rappresenta un singolo ticket all'interno di una coda
export interface QueueItem {
    _id: string;
    queueId: string;
    userId: string;
    ticket: number;
    payload: {
        userId?: string;
        username?: string;
        [key: string]: any;
    };
    status: 'waiting' | 'serving' | 'served' | 'quit';
    
    servingTimeEstimation: number; 
    startedServingAt?: string;
    servedAt?: string;    
    createdAt: string;
    updatedAt: string;
}

// Rappresenta la struttura generale di una coda
export interface Queue {
    _id: string;
    name: string;
    ownerId: string;
    active: boolean;
    averageServingTime: number;
    counter: number;
    createdAt: string;
    updatedAt: string;
}