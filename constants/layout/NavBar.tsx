import Image from "next/image";
import Link from "next/link";

export const NavBar = () => {
  return (
    <nav
      className="navbar navbar-expand-lg pt-2 pb-0 navbar-dark mb-3"
      style={{
        backgroundColor: "#2D6099",
        fontFamily: "Source Code Pro, monospace",
      }}
    >
      <div className="container-fluid">
        <Link className="navbar-brand" href="/" passHref>
          <a>
            <Image
              src="/logo_transparent-1.png"
              alt="convertor logo"
              width="90rem"
              height="70rem"
            />
          </a>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasNavbar"
          aria-controls="offcanvasNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div
          className="offcanvas offcanvas-end"
          tabIndex={-1}
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
        >
          <div
            className="offcanvas-header"
            style={{
              backgroundColor: "#2D6099",
            }}
          >
            <h5
              className="offcanvas-title"
              id="offcanvasNavbarLabel"
              style={{ color: "white" }}
            >
              Convertor
            </h5>
            <button
              type="button"
              className="btn-close text-reset btn-close-white"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            />
          </div>
          <div
            className="offcanvas-body"
            style={{
              backgroundColor: "#2D6099",
            }}
          >
            <ul className="navbar-nav justify-content-end pe-3">
              <li className="nav-item">
                <Link aria-current="page" href="/sql2entity">
                  <a className="nav-link active">sql2entity</a>
                </Link>
              </li>
            </ul>
            {/*<div className="d-flex">todo share link, twitter, likes</div>*/}
          </div>
        </div>
      </div>
    </nav>
  );
};
