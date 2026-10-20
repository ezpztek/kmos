import { loginAdmin } from "@/app/actions/admin";

export default function AdminLogin({ hasError }) {
  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <a className="admin-login-brand" href="/" aria-label="Return to K-Market Online Shopper">
          <img src="/assets/kmos-logo.png" alt="" />
          <span><strong>K-MARKET</strong><small>ADMIN CONSOLE</small></span>
        </a>
        <div className="admin-login-copy">
          <p className="admin-kicker">PRIVATE ACCESS</p>
          <h1 id="admin-login-title">Welcome back.</h1>
          <p>Sign in to manage the KMOS catalog and storefront order.</p>
        </div>
        <form className="admin-login-form" action={loginAdmin}>
          <label>Email address<input name="email" type="email" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          {hasError && <p className="admin-form-error" role="alert">That email or password is not correct.</p>}
          <button type="submit">Sign in</button>
        </form>
        <a className="admin-back-link" href="/">← Back to storefront</a>
      </section>
      <aside className="admin-login-art" aria-hidden="true"><span>KMOS</span><strong>Catalog<br />Control</strong></aside>
    </main>
  );
}
