import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login screen when not authenticated", () => {
  render(<App />);
  const heading = screen.getByText(/quality defect management system/i);
  expect(heading).toBeInTheDocument();
});
