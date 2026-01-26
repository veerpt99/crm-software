import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./Layout";
import Dashboard from "./Dashboard";
import Leads from "./Leads";
import LeadDetails from "./LeadDetails"; // ✅ NEW
import FollowUps from "./FollowUps";
import Company from "./Company";
import Jobs from "./Jobs";
import Candidate from "./Candidate";
import Login from "./Login";
import Profile from "./Profile";
import Interview from "./Interview";
import Protected from "./Protected";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />

          {/* LEADS LIST */}
          <Route
            path="/leads"
            element={
              <Protected>
                <Leads />
              </Protected>
            }
          />

          {/* ✅ LEAD DETAILS */}
          <Route
            path="/leads/:id"
            element={
              <Protected>
                <LeadDetails />
              </Protected>
            }
          />

          {/* FOLLOW UPS */}
          <Route
            path="/followups/:id"
            element={
              <Protected>
                <FollowUps />
              </Protected>
            }
          />

          <Route
            path="/companies"
            element={
              <Protected>
                <Company />
              </Protected>
            }
          />

          <Route
            path="/jobs"
            element={
              <Protected>
                <Jobs />
              </Protected>
            }
          />

          <Route
            path="/candidates"
            element={
              <Protected>
                <Candidate />
              </Protected>
            }
          />

          <Route
            path="/interviews"
            element={
              <Protected>
                <Interview />
              </Protected>
            }
          />

          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
