import {useRef, useEffect} from 'react';
import * as signalR from '@microsoft/signalr';

export function useSignalR (tripId, token, onLocationUpdate, onStatusUpdate){

    const connectionRef = useRef(null);

    useEffect(()=>{

        if(!tripId || !token)
            return;

        const connection  =new signalR.HubConnectionBuilder()
                .withUrl(`/hubs/trip?access_token=${token}`)
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Warning)
                .build();

        connection.on('ReceiveLocationUpdate', (data) =>{
            onLocationUpdate(data);
        });

        connection.on('ReceiveTripStatusUpdate', (data) =>{
            if(onStatusUpdate)
                onStatusUpdate(data);
        });

        connection.start()
                  .then(()=> connection.invoke('JoinTrip', tripId))
                  .catch(err => console.log('signalR error:', err));

        connectionRef.current = connection;

        return() =>{
            connection.invoke('LeaveTrip', tripId).catch(() =>{});
            connection.stop();
        };

    },[tripId, token]);
}