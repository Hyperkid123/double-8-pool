export const setElementProperty = (id, property, value) => {
  const element = document.getElementById(id);
  element[property] = value;
};
