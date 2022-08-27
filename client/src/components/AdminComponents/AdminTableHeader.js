import Divider from "components/UI/Divider";
import React, { useState } from "react";
import { FaFilter, FaPlus } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import Styles from "./AdminTableHeader.module.css";
import Select from "react-select";
import FilterModal from "./FilterModal";

const AdminTableHeader = ({ onSelect, type, filters }) => {
  const [selectedCount, setSelectedCount] = useState(10);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const onChangeHandler = ({ value }) => {
    setSelectedCount(value);
    onSelect(value);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsFilterModalOpen(false);
  };

  return (
    <>
      <FilterModal
        isFilterModalOpen={isFilterModalOpen}
        handleClose={handleClose}
        filters={filters}
      />

      <p className={Styles.table_header}>{type}</p>
      <Divider mb={".6em"} mt={0} bgColor={"#ADADAD"} />
      <div className={Styles.table_controls}>
        <div className={Styles.search}>
          <FiSearch />
          <input placeholder="Search" />
        </div>
        <div className={Styles.table_actions}>
          <button
            onClick={() => {
              setIsFilterModalOpen(true);
            }}
          >
            Filter <FaFilter />
          </button>
          <button>
            Insert
            <FaPlus />
          </button>
        </div>
      </div>
      <Divider mt={".6em"} mb={".6em"} bgColor={"#ADADAD"} />
      <div className={Styles.table_info_handler}>
        <p className={Styles.no_of_results}>Showing 1-10 of 1000 results</p>
        <div className={Styles.results_count_changer}>
          <span>Results Per Page</span>
          <Select
            options={getOptionsForPages()}
            placeholder={null}
            value={{
              value: selectedCount,
              label: selectedCount,
            }}
            styles={{
              indicatorSeparator: () => null,
              control: (provided, state) => ({
                ...provided,
                borderRadius: "5em",
              }),
              singleValue: (provided, state) => ({
                ...provided,
                fontWeight: "bold",
              }),
            }}
            onChange={onChangeHandler}
            defaultValue={{ value: selectedCount, label: selectedCount }}
          />
        </div>
      </div>
    </>
  );
};

const getOptionsForPages = () => {
  return [...Array(10).keys()].map((ele) => ({
    value: (ele + 1) * 10,
    label: (ele + 1) * 10,
  }));
};

const getStylesForPages = () => {};

export default AdminTableHeader;
