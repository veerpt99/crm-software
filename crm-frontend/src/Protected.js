import { Navigate } from "react-router-dom";

function Protected({children}){
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/login" />;
}

export default Protected;
