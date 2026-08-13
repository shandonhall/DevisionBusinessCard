import type { PublicCardViewModel } from "@/types/card";
import { QrCodeBlock } from "@/components/cards/qr-code-block";

/**
 * Reverse face of the Drive physical card.
 * Short bio + dealership + QR — not a miniature website.
 */
export function DriveCardReverse({
  model,
  qrValue,
}: {
  model: PublicCardViewModel;
  qrValue: string;
}) {
  const bio = model.employee.bio?.trim() || null;
  const dealership = model.location?.name || model.organisation.name;
  const website =
    model.location?.website ||
    model.brand?.website ||
    model.organisation.website;

  return (
    <div className="drive-card-back__inner">
      <p className="drive-card-back__kicker">
        {model.brand?.name || model.organisation.name}
      </p>
      <p className="drive-card-back__name">{model.employee.displayName}</p>
      {model.employee.jobTitle ? (
        <p className="drive-card-back__title">{model.employee.jobTitle}</p>
      ) : null}

      {bio ? <p className="drive-card-back__bio">{bio}</p> : null}

      <dl className="drive-card-back__meta">
        <div>
          <dt>Dealership</dt>
          <dd>{dealership}</dd>
        </div>
        {model.employee.mobile ? (
          <div>
            <dt>Phone</dt>
            <dd>{model.employee.mobile}</dd>
          </div>
        ) : null}
        {model.employee.email ? (
          <div>
            <dt>Email</dt>
            <dd>{model.employee.email}</dd>
          </div>
        ) : null}
        {website ? (
          <div>
            <dt>Web</dt>
            <dd className="drive-card-back__web">{website.replace(/^https?:\/\//, "")}</dd>
          </div>
        ) : null}
      </dl>

      <div className="drive-card-back__qr">
        <QrCodeBlock value={qrValue} size={92} />
      </div>
    </div>
  );
}
