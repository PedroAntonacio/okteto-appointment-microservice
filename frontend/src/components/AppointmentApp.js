import React, { Component } from "react";
import AppBar from "material-ui/AppBar";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import moment from "moment";
import DatePicker from "material-ui/DatePicker";
import Dialog from "material-ui/Dialog";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import TextField from "material-ui/TextField";
import SnackBar from "material-ui/Snackbar";
import Card from "material-ui/Card";
import {
  Step,
  Stepper,
  StepLabel,
  StepContent
} from "material-ui/Stepper";
import { RadioButton, RadioButtonGroup } from "material-ui/RadioButton";
import axios from "axios";

// const PORT = process.env.PORT || 8080;
// const API_BASE = `http://localhost:${PORT}/`;
const API_BASE = process.env.DB_ATLAS_URL;

class AppointmentApp extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      firstName: "",
      lastName: "",
      email: "",
      schedule: [],
      confirmationModalOpen: false,
      appointmentDateSelected: false,
      appointmentMeridiem: 0,
      validEmail: true,
      validPhone: true,
      finished: false,
      smallScreen: window.innerWidth < 768,
      stepIndex: 0
    };
  }
  componentWillMount() {
    axios.get(API_BASE + `api/retrieveSlots`).then(response => {
      console.log("response via db: ", response.data);
      this.handleDBReponse(response.data);
    });
  }
  handleSetAppointmentDate(date) {
    this.setState({ appointmentDate: date, confirmationTextVisible: true });
  }

  handleSetAppointmentSlot(slot) {
    this.setState({ appointmentSlot: slot });
  }
  handleSetAppointmentMeridiem(meridiem) {
    this.setState({ appointmentMeridiem: meridiem });
  }
  handleSubmit() {
    this.setState({ confirmationModalOpen: false });
    const newAppointment = {
      name: this.state.firstName + " " + this.state.lastName,
      email: this.state.email,
      phone: this.state.phone,
      queixa: this.state.queixa,
      slot_date: moment(this.state.appointmentDate).format("YYYY-DD-MM"),
      slot_time: this.state.appointmentSlot
    };
    axios
      .post(API_BASE + "api/appointmentCreate", newAppointment)
      .then(response =>
        this.setState({
          confirmationSnackbarMessage: "Consulta agendada com sucesso!",
          confirmationSnackbarOpen: true,
          processed: true
        })
      )
      .catch(err => {
        console.log(err);
        return this.setState({
          confirmationSnackbarMessage: "Falha ao agendar a consulta...",
          confirmationSnackbarOpen: true
        });
      });
  }
  
  handleNext = () => {
    const { stepIndex } = this.state;
    this.setState({
      stepIndex: stepIndex + 1,
      finished: stepIndex >= 2
    });
  };

  handlePrev = () => {
    const { stepIndex } = this.state;
    if (stepIndex > 0) {
      this.setState({ stepIndex: stepIndex - 1 });
    }
  };
  validateEmail(email) {
    const regex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return regex.test(email)
      ? this.setState({ email: email, validEmail: true })
      : this.setState({ validEmail: false });
  }
  validatePhone(phoneNumber) {
    // validate US phone number
    //const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    // validate Brazilian phone number
    const regex = /^[0-9]{11}$/;
    return regex.test(phoneNumber)
      ? this.setState({ phone: phoneNumber, validPhone: true })
      : this.setState({ validPhone: false });
  }
  checkDisableDate(day) {
    const dateString = moment(day).format("YYYY-DD-MM");
    return (
      this.state.schedule[dateString] === true ||
      moment(day)
        .startOf("day")
        .diff(moment().startOf("day")) < 0
    );
  }

  
  handleDBReponse(response) {
    const appointments = response;
    const today = moment().startOf("day"); //start of today 12 am
    const initialSchedule = {};
    initialSchedule[today.format("YYYY-DD-MM")] = true;
    const schedule = !appointments.length
      ? initialSchedule
      : appointments.reduce((currentSchedule, appointment) => {
          const { slot_date, slot_time } = appointment;
          const dateString = moment(slot_date, "YYYY-DD-MM").format(
            "YYYY-DD-MM"
          );
          !currentSchedule[slot_date]
            ? (currentSchedule[dateString] = Array(8).fill(false))
            : null;
          Array.isArray(currentSchedule[dateString])
            ? (currentSchedule[dateString][slot_time] = true)
            : null;
          return currentSchedule;
        }, initialSchedule);

    for (let day in schedule) {
      let slots = schedule[day];
      slots.length
        ? slots.every(slot => slot === true) ? (schedule[day] = true) : null
        : null;
    }

    this.setState({
      schedule: schedule
    });
  }
  renderAppointmentConfirmation() {
    const spanStyle = { color: "#00C853" };
    const linkConsulta = `https://webchat-okteto-frontend-pedroantonacio.cloud.okteto.net/?nome=${this.state.firstName.toLowerCase()} ${this.state.lastName.toLowerCase()}&sala=${moment(this.state.appointmentDate).format("YYYY-DD-MM")} às ${9 + this.state.appointmentSlot}:00`
    return (
      <section>
        <p>
          Nome:{" "}
          <span style={spanStyle}>
            {this.state.firstName} {this.state.lastName}
          </span>
        </p>
        <p>
          Celular: <span style={spanStyle}>{this.state.phone}</span>
        </p>
        <p>
          E-mail: <span style={spanStyle}>{this.state.email}</span>
        </p>
        <p>
          Consulta:{" "}
          <span style={spanStyle}>
            {moment(this.state.appointmentDate).format(
              "dddd[,] MMMM Do[,] YYYY"
            )}
          </span>{" "}
          at{" "}
          <span style={spanStyle}>
            {moment()
              .hour(9)
              .minute(0)
              .add(this.state.appointmentSlot, "hours")
              .format("h:mm a")}
          </span>
        </p>
        <p>
          Queixa médica: <span style={spanStyle}>{this.state.queixa}</span>
        </p>
        <p>
          Link da Consulta:
          <a style={spanStyle} href={linkConsulta}>
            {linkConsulta}
          </a>
        </p>
      </section>
    );
  }
  renderAppointmentTimes() {
    if (!this.state.isLoading) {
      const slots = [...Array(8).keys()];
      return slots.map(slot => {
        const appointmentDateString = moment(this.state.appointmentDate).format(
          "YYYY-DD-MM"
        );
        const time1 = moment()
          .hour(9)
          .minute(0)
          .add(slot, "hours");
        const time2 = moment()
          .hour(9)
          .minute(0)
          .add(slot + 1, "hours");
        const scheduleDisabled = this.state.schedule[appointmentDateString]
          ? this.state.schedule[
              moment(this.state.appointmentDate).format("YYYY-DD-MM")
            ][slot]
          : false;
        const meridiemDisabled = this.state.appointmentMeridiem
          ? time1.format("a") === "am"
          : time1.format("a") === "pm";
        return (
          <RadioButton
            label={time1.format("h:mm a") + " - " + time2.format("h:mm a")}
            key={slot}
            value={slot}
            style={{
              marginBottom: 15,
              display: meridiemDisabled ? "none" : "inherit"
            }}
            disabled={scheduleDisabled || meridiemDisabled}
          />
        );
      });
    } else {
      return null;
    }
  }

  renderStepActions(step) {
    const { stepIndex } = this.state;

    return (
      <div style={{ margin: "12px 0" }}>
        <RaisedButton
          label={stepIndex === 4 ? "Finalizar" : "Próximo"}
          disableTouchRipple={true}
          disableFocusRipple={true}
          primary={true}
          onClick={this.handleNext}
          backgroundColor="#00C853 !important"
          style={{ marginRight: 12, backgroundColor: "#00C853" }}
        />
        {step > 0 && (
          <FlatButton
            label="Voltar"
            disabled={stepIndex === 0}
            disableTouchRipple={true}
            disableFocusRipple={true}
            onClick={this.handlePrev}
          />
        )}
      </div>
    );
  }



  render() {
    const {
      finished,
      isLoading,
      smallScreen,
      stepIndex,
      confirmationModalOpen,
      confirmationSnackbarOpen,
      ...data
    } = this.state;
    const contactFormFilled =
      data.firstName &&
      data.lastName &&
      data.phone &&
      data.email &&
      data.validPhone &&
      data.validEmail;
    const DatePickerExampleSimple = () => (
      <div>
        <DatePicker
          hintText="Selecionar Data"
          mode={smallScreen ? "portrait" : "landscape"}
          onChange={(n, date) => this.handleSetAppointmentDate(date)}
          shouldDisableDate={day => this.checkDisableDate(day)}
        />
      </div>
    );
    const modalActions = [
      <FlatButton
        label="Cancelar"
        primary={false}
        onClick={() => this.setState({ confirmationModalOpen: false })}
      />,
      <FlatButton
        label="Confirmar"
        style={{ backgroundColor: "#00C853 !important" }}
        primary={true}
        onClick={() => this.handleSubmit()}
      />
    ];
    return (
      <div>
        <AppBar
          title="Agendamento de Consulta Online"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
        />
        <section
          style={{
            maxWidth: !smallScreen ? "80%" : "100%",
            margin: "auto",
            marginTop: !smallScreen ? 20 : 0
          }}
        >
          <p
            style={{
              maxWidth: !smallScreen ? "80%" : "100%",
              margin: 20,
              marginLeft: !smallScreen ? 20 : 0
            }}
          >
            PCS3853 - Laboratório de Engenharia de Software II<br></br>
            Pedro Orii Antonacio - nUSP 10333504
          </p>
          <Card
            style={{
              padding: "12px 12px 25px 12px",
              height: smallScreen ? "100vh" : null
            }}
          >
            <Stepper
              activeStep={stepIndex}
              orientation="vertical"
              linear={false}
            >
              <Step>
                <StepLabel>
                  Digite seu Nome
                </StepLabel>
                <StepContent>
                  <TextField
                    style={{ display: "block" }}
                    name="first_name"
                    hintText="Nome"
                    floatingLabelText="Nome"
                    onChange={(evt, newValue) =>
                      this.setState({ firstName: newValue })
                    }
                  />
                  <TextField
                    style={{ display: "block" }}
                    name="last_name"
                    hintText="Sobrenome"
                    floatingLabelText="Sobrenome"
                    onChange={(evt, newValue) =>
                      this.setState({ lastName: newValue })
                    }
                  />
                  <FlatButton
                    label="EMERGÊNCIA"
                    style={{ backgroundColor: "#ff0000", color: "#ffffff", marginTop: "1em", marginBottom: "0.5em" }}
                    onClick={() => window.open(`https://webchat-okteto-frontend-pedroantonacio.cloud.okteto.net/?nome=${this.state.firstName.toLowerCase()} ${this.state.lastName.toLowerCase()}&sala=emergencia`)}
                  />
                  {this.renderStepActions(0)}
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>
                  Escolha uma data para sua Consulta
                </StepLabel>
                <StepContent>
                  {DatePickerExampleSimple()}
                  {this.renderStepActions(1)}
                </StepContent>
              </Step>
              <Step disabled={!data.appointmentDate}>
                <StepLabel>
                  Escolha um horário para sua Consulta
                </StepLabel>
                <StepContent>
                  <SelectField
                    floatingLabelText="AM/PM"
                    value={data.appointmentMeridiem}
                    onChange={(evt, key, payload) =>
                      this.handleSetAppointmentMeridiem(payload)
                    }
                    selectionRenderer={value => (value ? "PM" : "AM")}
                  >
                    <MenuItem value={0} primaryText="AM" />
                    <MenuItem value={1} primaryText="PM" />
                  </SelectField>
                  <RadioButtonGroup
                    style={{
                      marginTop: 15,
                      marginLeft: 15
                    }}
                    name="appointmentTimes"
                    defaultSelected={data.appointmentSlot}
                    onChange={(evt, val) => this.handleSetAppointmentSlot(val)}
                  >
                    {this.renderAppointmentTimes()}
                  </RadioButtonGroup>
                  {this.renderStepActions(2)}
                </StepContent>
              </Step>

              <Step>
                <StepLabel>
                  Descreva o que você está sentido
                </StepLabel>
                <StepContent>
                  
                  <TextField
                        style={{ display: "block" }}
                        name="Queixa médica"
                        floatingLabelText="Queixa médica"
                        hintText="Descreva o que você está sentido ou o que você deseja saber"
                        fullWidth={true}
                        onChange={(evt, newValue) =>
                          this.setState({ queixa: newValue })
                        }
                      />
                  {this.renderStepActions(3)}
                </StepContent>
              </Step>

              <Step>
                <StepLabel>
                  Preencha suas informações de contato
                </StepLabel>
                <StepContent>
                  <p>
                    <section>
                      
                      <TextField
                        style={{ display: "block" }}
                        name="e-mail"
                        hintText="seu.email@mail.com"
                        floatingLabelText="e-mail"
                        errorText={
                          data.validEmail ? null : "Digite um endereço de email válido"
                        }
                        onChange={(evt, newValue) =>
                          this.validateEmail(newValue)
                        }
                      />
                      <TextField
                        style={{ display: "block" }}
                        name="Celular"
                        hintText="Apenas números com DDD"
                        floatingLabelText="Celular"
                        errorText={
                          data.validPhone ? null : "Digite um número de telefone válido"
                        }
                        onChange={(evt, newValue) =>
                          this.validatePhone(newValue)
                        }
                      />
                      <RaisedButton
                        style={{ display: "block", backgroundColor: "#00C853" }}
                        label={
                          contactFormFilled
                            ? "Agendar Consulta"
                            : "Preencha suas informações para prosseguir"
                        }
                        labelPosition="before"
                        primary={true}
                        fullWidth={true}
                        onClick={() =>
                          this.setState({
                            confirmationModalOpen: !this.state
                              .confirmationModalOpen
                          })
                        }
                        disabled={!contactFormFilled || data.processed}
                        style={{ marginTop: 20, maxWidth: 100 }}
                      />
                    </section>
                  </p>
                  {this.renderStepActions(4)}
                </StepContent>
              </Step>
            </Stepper>
          </Card>
          <Dialog
            modal={true}
            open={confirmationModalOpen}
            actions={modalActions}
            title="Confirmar Consulta"
          >
            {this.renderAppointmentConfirmation()}
          </Dialog>
          <SnackBar
            open={confirmationSnackbarOpen || isLoading}
            message={
              isLoading ? "Carregando... " : data.confirmationSnackbarMessage || ""
            }
            autoHideDuration={10000}
            onRequestClose={() =>
              this.setState({ confirmationSnackbarOpen: false })
            }
          />
        </section>
      </div>
    );
  }
}
export default AppointmentApp;
