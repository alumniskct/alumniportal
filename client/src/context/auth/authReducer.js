import {
  AUTH_FAILURE,
  AUTH_LOGOUT,
  AUTH_REQUEST,
  AUTH_SUCCESS,
} from "context/auth/authConstants";

export const initialState = {
  user: JSON.parse(localStorage.getItem("userInfo")) || null,
  isLoading: false,
  error: null,
};

export const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case AUTH_REQUEST:
      return { ...state, isLoading: true, error: null };
    case AUTH_SUCCESS:
      return { ...state, isLoading: false, user: action.payload };
    case AUTH_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    case AUTH_LOGOUT:
      return { user: null, isLoading: false, error: false };
    default:
      return state;
  }
};

export const authRegisterReducer = (state = initialState, action) => {
  switch (action.type) {
    case AUTH_REQUEST:
      return { ...state, isLoading: true };
    case AUTH_SUCCESS:
      return { ...state, isLoading: false, user: action.payload };
    case AUTH_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
};
