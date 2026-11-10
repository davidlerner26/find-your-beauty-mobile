// Whether the welcome screen was already shown since the app opened. It opens the app once per launch, for someone
// who is not signed in.
let seen = false;

export const welcomeSeen = () => seen;
export const markWelcomeSeen = () => {
  seen = true;
};
