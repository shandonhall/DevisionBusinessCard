import { describe, expect, it } from "vitest";
import { filterEmployees } from "@/lib/db/employee-filters";
import { normalisePhoneE164 } from "@/lib/validation/structure";
import type { Employee } from "@/types/database";

function employee(partial: Partial<Employee> & Pick<Employee, "id">): Employee {
  return {
    organisation_id: "org-1",
    brand_id: null,
    location_id: null,
    user_id: null,
    first_name: "Ada",
    last_name: "Lovelace",
    display_name: "Ada Lovelace",
    job_title: "Engineer",
    department: null,
    email: "ada@example.com",
    mobile: null,
    whatsapp: null,
    linkedin_url: null,
    profile_photo_url: null,
    bio: null,
    status: "active",
    employee_reference: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

describe("normalisePhoneE164", () => {
  it("keeps international numbers", () => {
    expect(normalisePhoneE164("+44 7700 900123")).toBe("+447700900123");
  });

  it("applies default country calling code for national numbers", () => {
    expect(normalisePhoneE164("0821234567", "27")).toBe("+27821234567");
    expect(normalisePhoneE164("5551234567", "1")).toBe("+15551234567");
  });

  it("returns null for empty or too-short values", () => {
    expect(normalisePhoneE164("")).toBeNull();
    expect(normalisePhoneE164("123")).toBeNull();
  });
});

describe("filterEmployees", () => {
  const rows = [
    employee({
      id: "1",
      brand_id: "b1",
      location_id: "l1",
      first_name: "Jane",
      last_name: "Doe",
      display_name: "Jane Doe",
      job_title: "Sales",
      status: "active",
    }),
    employee({
      id: "2",
      brand_id: "b2",
      location_id: "l2",
      first_name: "Sam",
      last_name: "Chen",
      display_name: "Sam Chen",
      email: "sam@acme.test",
      status: "archived",
    }),
  ];

  it("filters by query, brand, location and status", () => {
    expect(filterEmployees(rows, { query: "jane" })).toHaveLength(1);
    expect(filterEmployees(rows, { brandId: "b2" })[0]?.id).toBe("2");
    expect(filterEmployees(rows, { locationId: "l1" })[0]?.id).toBe("1");
    expect(filterEmployees(rows, { status: "archived" })).toHaveLength(1);
    expect(
      filterEmployees(rows, { query: "sam", status: "active" }),
    ).toHaveLength(0);
  });
});
