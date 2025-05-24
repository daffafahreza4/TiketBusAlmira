import {
  GET_ADMIN_TICKETS,
  GET_ADMIN_TICKET,
  UPDATE_TICKET_STATUS_SUCCESS,
  DELETE_ADMIN_TICKET_SUCCESS,
  TICKET_ADMIN_ERROR,
  CLEAR_TICKET_ADMIN
} from '../types';

const initialState = {
  tickets: [],
  selectedTicket: null,
  loading: false,
  error: null
};

const ticketAdminReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_ADMIN_TICKETS:
      console.log('🔍 [ticketAdminReducer] GET_ADMIN_TICKETS:', {
        payloadLength: payload?.length,
        currentTicketsLength: state.tickets.length
      });
      
      return {
        ...state,
        tickets: payload || [],
        loading: false,
        error: null
      };
      
    case GET_ADMIN_TICKET:
      console.log('🔍 [ticketAdminReducer] GET_ADMIN_TICKET:', {
        ticketId: payload?.id_tiket
      });
      
      return {
        ...state,
        selectedTicket: payload,
        loading: false,
        error: null
      };
      
    case UPDATE_TICKET_STATUS_SUCCESS:
      console.log('🔍 [ticketAdminReducer] UPDATE_TICKET_STATUS_SUCCESS:', {
        ticketId: payload?.id_tiket,
        newStatus: payload?.status_tiket
      });
      
      return {
        ...state,
        tickets: state.tickets.map(ticket =>
          ticket.id_tiket === payload.id_tiket ? payload : ticket
        ),
        selectedTicket: state.selectedTicket && state.selectedTicket.id_tiket === payload.id_tiket 
          ? payload 
          : state.selectedTicket,
        loading: false,
        error: null
      };
      
    case DELETE_ADMIN_TICKET_SUCCESS:
      console.log('🔍 [ticketAdminReducer] DELETE_ADMIN_TICKET_SUCCESS:', {
        deletedTicketId: payload
      });
      
      return {
        ...state,
        tickets: state.tickets.filter(ticket => ticket.id_tiket !== payload),
        selectedTicket: state.selectedTicket && state.selectedTicket.id_tiket === payload 
          ? null 
          : state.selectedTicket,
        loading: false,
        error: null
      };
      
    case TICKET_ADMIN_ERROR:
      console.error('❌ [ticketAdminReducer] TICKET_ADMIN_ERROR:', payload);
      
      return {
        ...state,
        error: payload,
        loading: false
      };
      
    case CLEAR_TICKET_ADMIN:
      console.log('🔍 [ticketAdminReducer] CLEAR_TICKET_ADMIN');
      
      return {
        ...state,
        selectedTicket: null,
        loading: true,
        error: null
      };
      
    default:
      return state;
  }
};

export default ticketAdminReducer;