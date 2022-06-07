import React from "react";

const EmptyView = (props) => {
  return (
    <div className="block-txt">
      {props.pageIsLoading ? (
        <div className="loader">Loading...</div>
      ) : (
        <p className="row-txt">Oops, something went wrong!!</p>
      )}
    </div>
  );
};

export default EmptyView;
