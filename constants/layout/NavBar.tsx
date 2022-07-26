import Image from "next/image";

export const NavBar = () => {
  return (
    <nav
      className="navbar navbar-expand-lg py-0 navbar-dark mb-3"
      style={{ backgroundColor: "#2D6099" }}
    >
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          <Image
            src="/logo_transparent-1.png"
            alt="convertor logo"
            width="90rem"
            height="70rem"
          />
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="#">
                sql2entity
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link disabled">Disabled</a>
            </li>
          </ul>
          {/*<div className="d-flex">todo share link, twitter, likes</div>*/}
        </div>
      </div>
    </nav>
  );
};
