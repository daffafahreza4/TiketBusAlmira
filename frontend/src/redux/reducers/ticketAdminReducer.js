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
    // Load all tickets for admin management
    case GET_ADMIN_TICKETS:
      return {
        ...state,
        tickets: payload || [],
        loading: false,
        error: null
      };
      
    // Load specific ticket details
    case GET_ADMIN_TICKET:
      return {
        ...state,
        selectedTicket: payload,
        loading: false,
        error: null
      };
      
    // Update ticket status in both list and selected state
    case UPDATE_TICKET_STATUS_SUCCESS:
      return {
        ...state,
        tickets: state.tickets.map(ticket =>
          ticket.id_tiket === payload.id_tiket ? payload : ticket
        ),
        selectedTicket: state.selectedTicket?.id_tiket === payload.id_tiket 
          ? payload 
          : state.selectedTicket,
        loading: false,
        error: null
      };
      
    // Remove ticket from list and clear if it was selected
    case DELETE_ADMIN_TICKET_SUCCESS:
      return {
        ...state,
        tickets: state.tickets.filter(ticket => ticket.id_tiket !== payload),
        selectedTicket: state.selectedTicket?.id_tiket === payload 
          ? null 
          : state.selectedTicket,
        loading: false,
        error: null
      };
      
    // Handle ticket admin errors
    case TICKET_ADMIN_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
      
    // Clear selected ticket and reset loading state
    case CLEAR_TICKET_ADMIN:
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