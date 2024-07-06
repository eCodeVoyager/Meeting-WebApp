// src/App.jsx
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Components/Login";
import MeetingRoom from "./Components/MeetingRoom";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
      </Routes>
    </Router>
  );
};

export default App;
