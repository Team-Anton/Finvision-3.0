import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest, authHeaders } from "../services/apiClient";

const AUTH_STORAGE_KEY = "finvision-v3-auth";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;
  const fullName = String(user.fullName || user.name || "").trim();
  const email = normalizeEmail(user.email);
  return {
    id: user.id,
    fullName: fullName || "FinVision User",
    name: fullName || "FinVision User",
    email,
    avatarColor: user.avatarColor || "#ef4444",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function readAuth() {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function writeAuth({ token, user }) {
  await AsyncStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ token, user: normalizeUser(user) }),
  );
}

async function clearStoredAuth() {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}

function messageFromError(error) {
  return error?.message || "Unable to reach server. Please try again.";
}

export const loadAuth = createAsyncThunk(
  "auth/load",
  async (_, { rejectWithValue }) => {
    try {
      const saved = await readAuth();
      const token = String(saved?.token || "");
      if (!token) {
        await clearStoredAuth();
        return { user: null, token: "", loggedIn: false };
      }

      const data = await apiRequest("/profile/me", {
        method: "GET",
        headers: authHeaders(token),
      });
      const user = normalizeUser(data.user);
      if (!user) {
        await clearStoredAuth();
        return { user: null, token: "", loggedIn: false };
      }

      await writeAuth({ token, user });
      return { user, token, loggedIn: true };
    } catch (error) {
      await clearStoredAuth();
      return rejectWithValue(messageFromError(error));
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    const cleanEmail = normalizeEmail(email);
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      return rejectWithValue("Please enter your email and password.");
    }
    if (!isValidEmail(cleanEmail)) {
      return rejectWithValue("Please enter a valid email address.");
    }

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });
      const user = normalizeUser(data.user);
      await writeAuth({ token: data.token, user });
      return { user, token: data.token };
    } catch (error) {
      return rejectWithValue(messageFromError(error));
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async ({ fullName, email, password }, { rejectWithValue }) => {
    const cleanName = String(fullName || "").trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPassword = String(password || "");

    if (!cleanName) return rejectWithValue("Please enter your full name.");
    if (!isValidEmail(cleanEmail)) {
      return rejectWithValue("Please enter a valid email address.");
    }
    if (!cleanPassword) return rejectWithValue("Please enter a password.");

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          password: cleanPassword,
        }),
      });
      const user = normalizeUser(data.user);
      await writeAuth({ token: data.token, user });
      return { user, token: data.token };
    } catch (error) {
      return rejectWithValue(messageFromError(error));
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ fullName, email }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    const cleanName = String(fullName || "").trim();
    const cleanEmail = normalizeEmail(email);

    if (!cleanName) return rejectWithValue("Please enter your full name.");
    if (!isValidEmail(cleanEmail)) {
      return rejectWithValue("Please enter a valid email address.");
    }

    try {
      const data = await apiRequest("/profile/me", {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
        }),
      });
      const user = normalizeUser(data.user);
      await writeAuth({ token, user });
      return { user };
    } catch (error) {
      return rejectWithValue(messageFromError(error));
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await clearStoredAuth();
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: "",
    loggedIn: false,
    hydrated: false,
    loading: false,
    profileSaving: false,
    error: "",
  },
  reducers: {
    clearAuthError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loggedIn = action.payload.loggedIn;
        state.hydrated = true;
        state.loading = false;
        state.error = "";
      })
      .addCase(loadAuth.rejected, (state, action) => {
        state.user = null;
        state.token = "";
        state.loggedIn = false;
        state.hydrated = true;
        state.loading = false;
        state.error = action.payload || "";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = "";
        state.loggedIn = false;
        state.loading = false;
        state.profileSaving = false;
        state.error = "";
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.token = "";
        state.loggedIn = false;
        state.loading = false;
        state.profileSaving = false;
        state.error = "Logged out, but the local session could not be cleared.";
      })
      .addCase(updateProfile.pending, (state) => {
        state.profileSaving = true;
        state.error = "";
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profileSaving = false;
        state.error = "";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileSaving = false;
        state.error = action.payload || "Profile update failed.";
      })
      .addMatcher(
        (action) => [login.pending.type, register.pending.type].includes(action.type),
        (state) => {
          state.loading = true;
          state.error = "";
        },
      )
      .addMatcher(
        (action) =>
          [login.fulfilled.type, register.fulfilled.type].includes(action.type),
        (state, action) => {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.loggedIn = true;
          state.loading = false;
          state.error = "";
        },
      )
      .addMatcher(
        (action) =>
          [login.rejected.type, register.rejected.type].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || "Authentication failed.";
        },
      );
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
