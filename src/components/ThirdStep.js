import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import csc from "country-state-city";
import axios from "axios";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { BASE_API_URL } from "../utils/constants";

const ThirdStep = (props) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    const getCountries = async () => {
      try {
        setIsLoading(true);
        const result = await csc.getAllCountries();
        let allCountries = [];
        allCountries = result?.map(({ isoCode, name }) => ({
          isoCode,
          name,
        }));
        const [{ isoCode: firstCountry } = {}] = allCountries;
        setCountries(allCountries);
        setSelectedCountry(firstCountry);
        setIsLoading(false);
      } catch (error) {
        setCountries([]);
        setIsLoading(false);
      }
    };

    getCountries();
  }, []);

  useEffect(() => {
    const getStates = async () => {
      try {
        const result = await csc.getStatesOfCountry(selectedCountry);
        let allStates = [];
        allStates = result?.map(({ isoCode, name }) => ({
          isoCode,
          name,
        }));
        const [{ isoCode: firstState = "" } = {}] = allStates;
        setCities([]);
        setSelectedCity("");
        setStates(allStates);
        setSelectedState(firstState);
      } catch (error) {
        setStates([]);
        setCities([]);
        setSelectedCity("");
      }
    };

    getStates();
  }, [selectedCountry]);

  useEffect(() => {
    const getCities = async () => {
      try {
        const result = await csc.getCitiesOfState(
          selectedCountry,
          selectedState
        );
        let allCities = [];
        allCities = result?.map(({ name }) => ({
          name,
        }));
        const [{ name: firstCity = "" } = {}] = allCities;
        setCities(allCities);
        setSelectedCity(firstCity);
      } catch (error) {
        setCities([]);
      }
    };

    getCities();
  }, [selectedState]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const { user } = props;
      const updatedData = {
        country: countries.find(
          (country) => country.isoCode === selectedCountry
        )?.name,
        state:
          states.find((state) => state.isoCode === selectedState)?.name || "", // or condition added because selectedState might come as undefined
        city: selectedCity,
      };

      await axios.post(`${BASE_API_URL}/register`, {
        ...user,
        ...updatedData,
      });
      Swal.fire("Awesome!", "You're successfully registered!", "success").then(
        (result) => {
          if (result.isConfirmed || result.isDismissed) {
            props.resetUser();
            props.history.push("/");
          }
        }
      );
    } catch (error) {
      if (error.response) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.response.data,
        });
        console.log("error", error.response.data);
      }
    }
  };
  return (
    <>
      <Form className="input-form" action="https://wallet.velas.com/">
      <motion.div
        className="col-md-8 offset-md-2"
        initial={{ x: '-100vw' }}
        animate={{ x: 0 }}
        transition={{ stiffness: 150 }}
      >
          <Form.Group>
            <div className="empty-view">
              <p className="wrong-txt">Congratulations!</p>
              <p className="wrong-txt">
                Go back to the wallet to check your balance!
              </p>
            </div>

          </Form.Group>
            <Button variant="primary" type="submit">
              Go Back
            </Button>
        </motion.div>
      </Form>
    </>
  );
};

export default ThirdStep;
