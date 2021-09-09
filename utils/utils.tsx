export const transformClasses = (style: any, classes: string) => {
  if (!style) return "style object is mandatory";

  const arr = classes?.split(" ") ?? [];
  return arr
    .map((val) => {
      return style[val] ?? "";
    })
    .join(" ");
};
