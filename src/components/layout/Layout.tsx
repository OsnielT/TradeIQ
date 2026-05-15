import { Outlet } from 'react-router-dom';
import { Header } from './Header.tsx';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p className={styles.disclaimer}>
          <strong>Educational purposes only.</strong> TradeIQ is not a financial advisor.
          Nothing on this platform constitutes financial, investment, or trading advice.
          All examples are for educational purposes only. Trading involves significant risk
          of loss and may not be suitable for all investors.
        </p>
      </footer>
    </div>
  );
}
