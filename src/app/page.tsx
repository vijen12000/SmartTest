import { QuestionBank } from '@/components/QuestionBank';

export default function Home() {
  return (
    <div id="wrapper" className="d-flex">
      <aside className="sb-sidebar bg-gradient-primary d-flex flex-column p-3 text-white">
        <a className="sidebar-brand d-flex align-items-center mb-4 text-white text-decoration-none" href="#">
          <div className="sidebar-brand-icon me-2">
            <i className="fas fa-book-open-reader" aria-hidden="true"></i>
          </div>
          <div className="sidebar-brand-text fw-bold">DSAI Study</div>
        </a>

        <hr className="sidebar-divider my-3" />
        <div className="small text-uppercase fw-bold text-white-50 mb-2">Trimesters</div>
        <ul id="trimester-sidebar-slot" className="nav flex-column" aria-label="Trimester navigation"></ul>
      </aside>

      <div id="content-wrapper" className="d-flex flex-column w-100">
        <div id="content">
          <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow-sm">
            <div className="container-fluid">
              <span className="navbar-brand m-0 h5 text-primary fw-bold">Data Science and AI Study</span>              
            </div>
          </nav>

          <main className="container-fluid pb-4">
            <QuestionBank
              defaultTrimesterId="trimester-2"
              defaultSubjectId="trimester-2-da105"
              defaultTestId="pt-6"
            />
          </main>
        </div>

        <footer className="sticky-footer bg-white mt-auto py-3 border-top">
          <div className="container-fluid">
            <div className="text-center small text-muted">Data Science and AI Study</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
