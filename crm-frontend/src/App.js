import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./Layout";
import Dashboard from "./Dashboard";
import Leads from "./Leads";
import LeadDetails from "./LeadDetails";
import FollowUps from "./FollowUps";
import Company from "./company";
import CompanyDetails from "./CompanyDetails";
import Jobs from "./Jobs";
import JobDetails from "./JobDetails";
import Candidate from "./Candidate";
import Login from "./Login";
import Profile from "./Profile";
import Interview from "./Interview";
import Protected from "./Protected";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH */}
        <Route path="/login" element={<Login />} />

        {/* APP LAYOUT */}
        <Route element={<Layout />}>
          {/* DASHBOARD */}
          <Route
            path="/"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />

          {/* LEADS */}
          <Route
            path="/leads"
            element={
              <Protected>
                <Leads />
              </Protected>
            }
          />

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

          {/* COMPANIES */}
          <Route
            path="/companies"
            element={
              <Protected>
                <Company />
              </Protected>
            }
          />

          <Route
            path="/company/:id"
            element={
              <Protected>
                <CompanyDetails />
              </Protected>
            }
          />

          {/* JOBS */}
          <Route
            path="/jobs"
            element={
              <Protected>
                <Jobs />
              </Protected>
            }
          />

          <Route
            path="/job/:id"
            element={
              <Protected>
                <JobDetails />
              </Protected>
            }
          />

          {/* CANDIDATES */}
          <Route
            path="/candidates"
            element={
              <Protected>
                <Candidate />
              </Protected>
            }
          />

          {/* INTERVIEWS */}
          <Route
            path="/interviews"
            element={
              <Protected>
                <Interview />
              </Protected>
            }
          />

          {/* PROFILE */}
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
