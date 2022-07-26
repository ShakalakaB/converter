import { FC, PropsWithChildren } from "react";
import { NavBar } from "./NavBar";

export const Layout: FC<PropsWithChildren<{}>> = ({ children }) => (
  <>
    <NavBar />

    <main className="container-fluid px-3 mb-3">{children}</main>

    <footer
      style={{
        color: "rgb(48, 48, 48)",
        fontSize: "12px",
        textAlign: "center",
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        // border: "2px solid black",
      }}
    >
      Copyright © 2022 convertor.aldoraweb.com
    </footer>
  </>
);
