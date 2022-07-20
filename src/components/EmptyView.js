import React from "react";

const EmptyView = (props) => {
  return (
    <div className="block-txt">
      {props.pageIsLoading ? (
        <div className="loader">Loading...</div>
      ) : (
        <div style={{marginTop: 30}}><p className="row-txt">Oops, something went wrong!!</p></div>
      )}
    </div>
  );
};

export default EmptyView;
