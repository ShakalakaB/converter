import { FC, PropsWithChildren } from "react";
import { NavBar } from "./NavBar";

export const Layout: FC<PropsWithChildren<{}>> = ({ children }) => (
  <div className="min-vh-100 d-flex flex-column">
    <NavBar />

    <main className="container-fluid">{children}</main>

    <footer
      className="mt-auto"
      style={{
        color: "rgb(48, 48, 48)",
        fontSize: "12px",
        textAlign: "center",
      }}
    >
      Copyright © 2022 convertor.aldoraweb.com
    </footer>
  </div>
);
