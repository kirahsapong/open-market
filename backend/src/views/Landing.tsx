import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkCondition = async () => {
      const result = await someAsyncOperation();
      if (result) {
        navigate('/products');
      }
      setLoading(false);
    };

    checkCondition();
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <h1>Landing Page</h1>;
};

export default Landing;

const someAsyncOperation = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
};