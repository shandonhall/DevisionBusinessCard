"use client";

import { useEffect, useRef } from "react";
import type { ResolvedCampaign } from "@/lib/campaigns/types";
import type { AnalyticsTracker } from "@/lib/analytics/types";

/**
 * First-party dealership/brand campaign panel for desktop studio sides.
 * Not third-party advertising. Hidden on mobile via CSS.
 */
export function DriveCampaignSlot({
  campaign,
  tracker,
}: {
  campaign: ResolvedCampaign;
  tracker?: AnalyticsTracker;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const seenRef = useRef(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !tracker) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || seenRef.current) return;
        seenRef.current = true;
        tracker.track({
          eventType: "campaign_impression",
          metadata: {
            campaignId: campaign.id,
            placement: campaign.placement,
          },
        });
      },
      { threshold: 0.45 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [campaign.id, campaign.placement, tracker]);

  return (
    <article ref={rootRef} className="drive-campaign">
      {campaign.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={campaign.image_url}
          alt=""
          className="drive-campaign__image"
        />
      ) : null}
      <div className="drive-campaign__body">
        <h2 className="drive-campaign__title">{campaign.title}</h2>
        {campaign.body ? (
          <p className="drive-campaign__copy">{campaign.body}</p>
        ) : null}
        {campaign.cta_url && campaign.cta_label ? (
          <a
            href={campaign.cta_url}
            className="drive-campaign__cta"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              tracker?.track({
                eventType: "campaign_click",
                metadata: {
                  campaignId: campaign.id,
                  placement: campaign.placement,
                  destinationType: "external",
                },
              });
            }}
          >
            {campaign.cta_label}
          </a>
        ) : null}
      </div>
    </article>
  );
}
