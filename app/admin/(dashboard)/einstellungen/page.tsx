import { getNotificationSettings } from "@/lib/settings";
import NotificationSettingsForm from "@/components/admin/NotificationSettingsForm";

export default async function AdminEinstellungenPage() {
  const settings = await getNotificationSettings();
  const from = process.env.EMAIL_FROM ?? "";
  const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  return (
    <>
      <div>
        <h2>Benachrichtigungen</h2>
        <p>
          An diese Adressen geht bei jeder neuen Anfrage eine kurze Text-Mail mit allen Angaben aus dem
          Formular. Der Anfragende bekommt parallel automatisch seine Bestätigungsmail.
        </p>
      </div>

      <NotificationSettingsForm settings={settings} />

      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Versand-Status</h3>
        <p style={{ margin: "0 0 8px" }}>
          <b>SMTP-Verbindung:</b>{" "}
          <span className={`status ${smtpReady ? "live" : "missing"}`}>
            {smtpReady ? "eingerichtet" : "nicht eingerichtet"}
          </span>
        </p>
        <p style={{ margin: 0 }}>
          <b>Absenderadresse:</b> {from || "— (Env-Variable EMAIL_FROM fehlt)"}
        </p>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0 0" }}>
          Tipp: Diese Absenderadresse einmal im Mailprogramm zu den Kontakten hinzufügen — dann landen
          Benachrichtigungen dauerhaft im Posteingang statt im Spam.
        </p>
      </div>
    </>
  );
}
