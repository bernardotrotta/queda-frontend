// Rappresenta un singolo ticket all'interno di una coda
export interface QueueItem {
    _id: string;
    queueId: string;
    ticket: number;
    // Il payload contiene dati extra come l'ID o lo username dell'utente
    payload: {
        userId?: string;
        username?: string;
        [key: string]: any;
    };
    // Lo stato segue l'enum definito nel backend: waiting, serving o served
    status: 'waiting' | 'serving' | 'served';
    
    // CAMPI TEMPORALI (Aggiunti per risolvere l'errore)
    // Indica la stima del servizio in millisecondi
    servingTimeEstimation: number; 
    startedServingAt?: string;
    // Nota: manteniamo il nome con il typo 'serevedAt' per coerenza con il modello backend
    serevedAt?: string; 
    
    createdAt: string;
    updatedAt: string;
}

// Rappresenta la struttura generale di una coda
export interface Queue {
    _id: string;
    name: string;
    ownerId: string;
    active: boolean;
    // Stima base definita alla creazione della coda
    servingTimeEstimation: number; 
    createdAt: string;
    updatedAt: string;
}