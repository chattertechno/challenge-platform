export function isPassword(val) {
    let regPass = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,32}$/;
    if (!regPass.test(val)) {
        return true;
    }
  }
  export function isIdentity(val) {
    let regIdentity = /^[a-zA-Z0-9!@#$%^&*()_+=?]{0,20}$/ ;
    if (!regIdentity.test(val)) {
        return true;
    }
  }