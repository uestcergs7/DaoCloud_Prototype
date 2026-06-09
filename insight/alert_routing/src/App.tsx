import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PolicyList from "./pages/PolicyList";
import Home from "./pages/Home";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<PolicyList />} />
          <Route path="/alerts" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
}
