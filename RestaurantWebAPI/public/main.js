// Normally the accessToken is not embedded in the client code, but I am doing it as an exception
// However since this is server side pagination, we loose the logged in state everytime and we need to do this.
// Once again purely for convenience, not in the real world!
// Also enabled dummy_token mode
validAccessToken = 'eyJhbGciOiJIUzI1NiJ9.SWFtdGhlZXhwZXJ0MTExMjIzMw.x10fDiXwYfFv8y_qM0Apb1Hh_AJbgPCyn1uRreRiT8o';

function enableDisableButtons() {
  let page = parseInt($("#pageNo").val());
  let perPage = parseInt($("#perPage").val());
  let startingRecordIndex = perPage * (page - 1);
  let totalRecords = parseInt($('#totalRecords').text().split(' ')[0]);

  if (startingRecordIndex == 0) {
    $("#prevButton").prop('disabled', true);
    $("#firstButton").prop('disabled', true);
  } else {
    $("#prevButton").prop('disabled', false);
    $("#firstButton").prop('disabled', false);
  }

  if (startingRecordIndex + perPage > totalRecords - 1) {
    $("#nextButton").prop('disabled', true);
    $("#lastButton").prop('disabled', true);
  } else {
    $("#nextButton").prop('disabled', false);
    $("#lastButton").prop('disabled', false);
  }
}

// This function 'keepLoggedIn' is only for Professor's convenience of the GUI
// Normally the accessToken is not embedded in the client code, but I am doing it as an exception
// However since this is server side pagination, we loose the logged in state everytime and we need to do this.
// Once again purely for convenience, not in the real world!
function keepLoggedInIfCorrectToken(accessToken) {
  if (accessToken == validAccessToken) {
    $('#accessToken').val(accessToken);
    $('#loginButton').prop('value', 'Logout');
    $('#loginButton').css('background-color', 'rgb(253, 169, 169)');
    $('#loginError').text('');
    $('#password').val('')
    $('#password').hide();
    $('#passwordLabel').hide();
  } else {
    disableMenu(true);
  }
}

function handleGetPage() {
  displayPage();
}

function handleAddNewButton() {
  let currentUrl = window.location;
  let baseUrl = currentUrl.protocol + "//" + currentUrl.host + "/" + currentUrl.pathname.split('/')[1];
  location.href = baseUrl + '/restaurant_add' + '?accessToken=' + validAccessToken;
}

function handlePrevButton() {
  let page = parseInt($("#pageNo").val());
  let perPage = parseInt($("#perPage").val());
  let startingRecordIndex = perPage * (page - 1);

  if (startingRecordIndex - perPage < 0) {
    $("#pageNo").val("1");
  } else {
    $("#pageNo").val($("#pageNo").val() - 1);
  }

  displayPage();
}

function handleNextButton() {
  let page = parseInt($("#pageNo").val());
  let perPage = parseInt($("#perPage").val());
  let startingRecordIndex = perPage * (page - 1);
  let totalRecords = parseInt($('#totalRecords').text().split(' ')[0]);

  let lastPage = Math.floor(totalRecords / perPage);
  var remainder = totalRecords % perPage;
  if (remainder > 0) {
    lastPage++;
  }

  if (startingRecordIndex + perPage > totalRecords - 1) {
    $("#pageNo").val(lastPage);
  } else {
    $("#pageNo").val(parseInt($("#pageNo").val()) + 1);
  }

  displayPage();
}

function handleFirstButton() {
  $("#pageNo").val("1");
  displayPage();
}

function handleLastButton() {
  let perPage = parseInt($("#perPage").val());
  let totalRecords = parseInt($('#totalRecords').text().split(' ')[0]);

  let lastPage = Math.floor(totalRecords / perPage);
  var remainder = totalRecords % perPage;
  if (remainder > 0) {
    lastPage++;
  }

  $("#pageNo").val(lastPage);
  displayPage();
}

function displayPage() {
  let page = parseInt($("#pageNo").val());
  let perPage = parseInt($("#perPage").val());
  let borough = $('#borough').val();
  let cuisine = $('#cuisine').val();
  let accessToken = $('#accessToken').val();

  let totalRecords = parseInt($('#totalRecords').text().split(' ')[0]);
  if (totalRecords > 0) {
    let lastPage = Math.floor(totalRecords / perPage);
    var remainder = totalRecords % perPage;
    if (remainder > 0) {
      lastPage++;
    }

    if (page > lastPage) page = lastPage;
  }

  let currentUrl = window.location;
  let baseUrl = currentUrl.protocol + "//" + currentUrl.host + "/" + currentUrl.pathname.split('/')[1];

  if ((borough) && (cuisine)) {
    location.href = baseUrl + '/restaurants' + '?page=' + page + '&perPage=' + perPage + '&borough=' + borough + '&cuisine=' + cuisine + '&accessToken=' + accessToken;
  } else if (borough) {
    location.href = baseUrl + '/restaurants' + '?page=' + page + '&perPage=' + perPage + '&borough=' + borough + '&accessToken=' + accessToken;
  } else if (cuisine) {
    location.href = baseUrl + '/restaurants' + '?page=' + page + '&perPage=' + perPage + '&cuisine=' + cuisine + '&accessToken=' + accessToken;
  } else {
    location.href = baseUrl + '/restaurants' + '?page=' + page + '&perPage=' + perPage + '&accessToken=' + accessToken;
  }
}

function disableMenu(flag) {
  $('#addNewButton').prop('disabled', flag);
  $('#getButton').prop('disabled', flag);
  $('#cuisine').prop('disabled', flag);
  $('#borough').prop('disabled', flag);
  $('#pageNo').prop('disabled', flag);
  $('#perPage').prop('disabled', flag);
}

$(document).ready(function() {
  let currentUrl = window.location;
  var url = new URL(currentUrl);
  var accessToken = url.searchParams.get("accessToken");

  keepLoggedInIfCorrectToken(accessToken);

  enableDisableButtons();
  $("#pageNo").focusout(function() {
    let val = $("#pageNo").val();
    if ((!val) || (val == '0')) {
      $("#pageNo").val(1);
    }
  });

  $("#perPage").focusout(function() {
    let val = $("#perPage").val();
    if ((!val) || (val == '0')) {
      $("#perPage").val(5);
    }
  });

  $('.goto_list').on('click', function() {
    let currentUrl = window.location;
    let baseUrl = currentUrl.protocol + "//" + currentUrl.host + "/" + currentUrl.pathname.split('/')[1];
    var url = new URL(currentUrl);
    var accessToken = url.searchParams.get("accessToken");
    if (accessToken) {
      location.href = baseUrl + '/restaurants?page=1&perPage=5&accessToken=' + accessToken;
    } else {
      location.href = baseUrl + '/restaurants?page=1&perPage=5';
    }
  });

  $('#update_restaurant').on('click', function() {
    let restaurant_id = $('#restaurant_id_hidden').val();
    $.ajax({
      url: `/api/restaurant/${restaurant_id}`,
      type: 'put',
      dataType: 'json',
      data: $('form#update_restaurant_form').serialize(),
      success: function(data) {
        let currentUrl = window.location;
        let baseUrl = currentUrl.protocol + "//" + currentUrl.host + "/" + currentUrl.pathname.split('/')[1];
        var url = new URL(currentUrl);
        var accessToken = url.searchParams.get("accessToken");
        if (accessToken) {
          location.href = baseUrl + '/restaurants?page=1&perPage=5&accessToken=' + accessToken;
        } else {
          location.href = baseUrl + '/restaurants?page=1&perPage=5';
        }
      },
      error: function(err) {
        console.log(err);
      }
    });
  });

  $('#delete_restaurant').on('click', function() {
    let restaurant_id = $('#restaurant_id_hidden').val();
    $.ajax({
      url: `/api/restaurant/${restaurant_id}`,
      type: 'delete',
      dataType: 'json',
      data: $('form#delete_restaurant_form').serialize(),
      success: function(data) {
        let currentUrl = window.location;
        let baseUrl = currentUrl.protocol + "//" + currentUrl.host + "/" + currentUrl.pathname.split('/')[1];
        var url = new URL(currentUrl);
        var accessToken = url.searchParams.get("accessToken");
        if (accessToken) {
          location.href = baseUrl + '/restaurants?page=1&perPage=5&accessToken=' + accessToken;
        } else {
          location.href = baseUrl + '/restaurants?page=1&perPage=5';
        }
      },
      error: function(err) {
        console.log(err);
      }
    });
  });

  $('#password').on('keydown', function() {
    $('#loginError').text('');
  });

  $('#loginButton').on('click', function() {
    let text = $('#loginButton').prop('value');
    let password = $('#password').val();
    if (text == 'Logout') {
      $('#accessToken').val();
      $('#loginButton').prop('value', 'Login');
      $('#loginButton').css('background-color', 'rgb(189, 237, 179)');
      $('#password').show();
      $('#passwordLabel').show();
      $('#password').val('')
      disableMenu(true);
      let currentUrl = window.location;
      let baseUrl = currentUrl.protocol + "//" + currentUrl.host + "/" + currentUrl.pathname.split('/')[1];
      location.href = baseUrl + '/restaurants?page=1&perPage=5';
    } else {
      $.ajax({
        url: '/api/login',
        type: 'post',
        dataType: 'json',
        data: { password: password },
        success: function(data) {
          $('#accessToken').val(data.accessToken);
          $('#loginButton').prop('value', 'Logout');
          $('#loginButton').css('background-color', 'rgb(253, 169, 169)');
          $('#loginError').text('');
          $('#password').val('')
          $('#password').hide();
          $('#passwordLabel').hide();
          disableMenu(false);
          displayPage();
        },
        error: function(err) {
          $('#accessToken').val();
          $('#loginError').text('Incorrect password');
          $('#password').show();
          $('#passwordLabel').show();
          disableMenu(true);
        }
      });
    }
  });

  $('#getButton').on('click', function() {
    handleGetPage();
  });

  $('#addNewButton').on('click', function() {
    handleAddNewButton();
  });

  $('#firstButton').on('click', function() {
    handleFirstButton();
  });
  $('#prevButton').on('click', function() {
    handlePrevButton();
  });
  $('#nextButton').on('click', function() {
    handleNextButton();
  });
  $('#lastButton').on('click', function() {
    handleLastButton();
  });

});