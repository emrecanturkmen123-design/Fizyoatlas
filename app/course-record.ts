import { parseKneeCourse } from "./knee-course-data";
import { parseRegionalCourse } from "./regional-course-data";
export const parseCourseRecord = (value: unknown) =>
  parseKneeCourse(value) ?? parseRegionalCourse(value);
