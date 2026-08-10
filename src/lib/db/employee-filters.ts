import type { Employee } from "@/types/database";

export type EmployeeFilter = {
  query?: string;
  brandId?: string | null;
  locationId?: string | null;
  status?: string | null;
};

/**
 * Pure client/server filter for team lists.
 * Keeps search logic unit-testable without Supabase.
 */
export function filterEmployees(
  employees: Employee[],
  filter: EmployeeFilter,
): Employee[] {
  const query = filter.query?.trim().toLowerCase() ?? "";
  return employees.filter((employee) => {
    if (filter.brandId && employee.brand_id !== filter.brandId) return false;
    if (filter.locationId && employee.location_id !== filter.locationId) {
      return false;
    }
    if (filter.status && employee.status !== filter.status) return false;

    if (!query) return true;

    const haystack = [
      employee.first_name,
      employee.last_name,
      employee.display_name,
      employee.job_title,
      employee.email,
      employee.department,
      employee.employee_reference,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}
