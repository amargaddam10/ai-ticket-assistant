import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { useSocket } from './useSocket';
import {
  createTicket,
  updateTicket as updateExistingTicket,
} from '../store/slices/ticketSlice';
import { addNotification } from '../store/slices/notificationSlice';
import { toast } from 'react-hot-toast';

interface SocketEvents {
  'ticket:created': any;
  'ticket:updated': any;
  'ticket:assigned': any;
  'ticket:status_changed': any;
  'comment:added': any;
  'notification:new': any;
  'user:online': any;
  'user:offline': any;
}

const useRealTimeUpdates = () => {
  const dispatch = useAppDispatch();
  const socket = useSocket();
  const currentUser = useAppSelector((state) => state.auth.user);

  const handleTicketCreated = useCallback(
    (ticket: any) => {
      // Use createTicket thunk instead of addTicket
      dispatch(createTicket(ticket));

      // Show toast notification if it's not the current user's ticket
      if (ticket.user._id !== currentUser?._id) {
        toast.success(`New ticket created: ${ticket.title}`, {
          duration: 4000,
          position: 'top-right',
        });
      }

      // Add to notifications
      if (currentUser?.role !== 'user') {
        dispatch(
          addNotification({
            id: `ticket-created-${ticket._id}`,
            type: 'ticket_created',
            title: 'New Ticket Created',
            message: `${ticket.user.name} created a new ticket: ${ticket.title}`,
            isRead: false,
            createdAt: new Date().toISOString(),
            ticket: {
              _id: ticket._id,
              title: ticket.title,
            },
          })
        );
      }
    },
    [dispatch, currentUser]
  );

  const handleTicketUpdated = useCallback(
    (ticket: any) => {
      // Use updateTicket thunk instead of updateTicket action
      dispatch(updateExistingTicket({ ticketId: ticket._id, updates: ticket }));

      // Show toast for relevant updates
      if (
        ticket.assignedTo?._id === currentUser?._id ||
        ticket.user._id === currentUser?._id
      ) {
        toast.info(`Ticket updated: ${ticket.title}`, {
          duration: 3000,
          position: 'top-right',
        });
      }
    },
    [dispatch, currentUser]
  );

  const handleTicketAssigned = useCallback(
    (data: { ticket: any; assignedTo: any }) => {
      const { ticket, assignedTo } = data;
      dispatch(updateExistingTicket({ ticketId: ticket._id, updates: ticket }));

      // Notify the assigned user
      if (assignedTo._id === currentUser?._id) {
        toast.success(`You've been assigned to: ${ticket.title}`, {
          duration: 5000,
          position: 'top-right',
        });

        dispatch(
          addNotification({
            id: `ticket-assigned-${ticket._id}`,
            type: 'ticket_assigned',
            title: 'Ticket Assigned',
            message: `You've been assigned to ticket: ${ticket.title}`,
            isRead: false,
            createdAt: new Date().toISOString(),
            ticket: {
              _id: ticket._id,
              title: ticket.title,
            },
          })
        );
      }
    },
    [dispatch, currentUser]
  );

  const handleStatusChanged = useCallback(
    (data: { ticket: any; oldStatus: string; newStatus: string }) => {
      const { ticket, oldStatus, newStatus } = data;
      dispatch(updateExistingTicket({ ticketId: ticket._id, updates: ticket }));

      // Notify ticket creator about status changes
      if (ticket.user._id === currentUser?._id) {
        toast.info(`Ticket status changed from ${oldStatus} to ${newStatus}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    },
    [dispatch, currentUser]
  );

  const handleCommentAdded = useCallback(
    (data: { ticket: any; comment: any }) => {
      const { ticket, comment } = data;
      dispatch(updateExistingTicket({ ticketId: ticket._id, updates: ticket }));

      // Notify relevant users about new comments
      const isRelevantUser =
        ticket.user._id === currentUser?._id ||
        ticket.assignedTo?._id === currentUser?._id;

      if (isRelevantUser && comment.user._id !== currentUser?._id) {
        toast.info(`New comment on: ${ticket.title}`, {
          duration: 4000,
          position: 'top-right',
        });

        dispatch(
          addNotification({
            id: `comment-added-${ticket._id}-${comment._id}`,
            type: 'comment_added',
            title: 'New Comment',
            message: `${comment.user.name} commented on: ${ticket.title}`,
            isRead: false,
            createdAt: new Date().toISOString(),
            ticket: {
              _id: ticket._id,
              title: ticket.title,
            },
          })
        );
      }
    },
    [dispatch, currentUser]
  );

  const handleNewNotification = useCallback(
    (notification: any) => {
      dispatch(addNotification(notification));

      // Show toast for high priority notifications
      if (notification.type === 'sla_breach') {
        toast.error(notification.title, {
          duration: 6000,
          position: 'top-right',
        });
      }
    },
    [dispatch]
  );

  const handleUserOnline = useCallback((user: any) => {
    // Update user status in the store if needed
    console.log(`User ${user.name} is now online`);
  }, []);

  const handleUserOffline = useCallback((user: any) => {
    // Update user status in the store if needed
    console.log(`User ${user.name} is now offline`);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Register all socket event listeners
    socket.on('ticket:created', handleTicketCreated);
    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('ticket:assigned', handleTicketAssigned);
    socket.on('ticket:status_changed', handleStatusChanged);
    socket.on('comment:added', handleCommentAdded);
    socket.on('notification:new', handleNewNotification);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    // Join user-specific room for personalized updates
    if (currentUser) {
      socket.emit('join:user_room', currentUser._id);
    }

    // Cleanup listeners on unmount
    return () => {
      socket.off('ticket:created', handleTicketCreated);
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('ticket:assigned', handleTicketAssigned);
      socket.off('ticket:status_changed', handleStatusChanged);
      socket.off('comment:added', handleCommentAdded);
      socket.off('notification:new', handleNewNotification);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [
    socket,
    currentUser,
    handleTicketCreated,
    handleTicketUpdated,
    handleTicketAssigned,
    handleStatusChanged,
    handleCommentAdded,
    handleNewNotification,
    handleUserOnline,
    handleUserOffline,
  ]);

  // Provide methods to emit events
  const emitTicketUpdate = useCallback(
    (ticketId: string, updates: any) => {
      if (socket) {
        socket.emit('ticket:update', { ticketId, updates });
      }
    },
    [socket]
  );

  const emitCommentAdd = useCallback(
    (ticketId: string, comment: string) => {
      if (socket) {
        socket.emit('comment:add', { ticketId, comment });
      }
    },
    [socket]
  );

  const emitUserActivity = useCallback(
    (activity: string) => {
      if (socket && currentUser) {
        socket.emit('user:activity', { userId: currentUser._id, activity });
      }
    },
    [socket, currentUser]
  );

  return {
    emitTicketUpdate,
    emitCommentAdd,
    emitUserActivity,
    isConnected: socket?.connected || false,
  };
};

export default useRealTimeUpdates;
