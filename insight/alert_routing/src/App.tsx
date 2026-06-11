import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PolicyList from "./pages/PolicyList";
import Home from "./pages/Home";
import Layout from "./components/Layout";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <Router basename={basename}>
      <Layout>
        <Routes>
          <Route path="/" element={<PolicyList />} />
          <Route path="/alerts" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
}
